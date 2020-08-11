const Apify = require('apify');
const helpers = require('./helpers');

const {
    utils: { requestAsBrowser },
} = Apify;

/**
 *
 * @param {string} placeId
 * @param {string} timeFrame
 * @param {string} locale
 * @return {Apify.RequestOptions}
 */
function constructWeatherRequestOptions(placeId, timeFrame, locale) {
    const url = `https://weather.com/${locale}/weather/${timeFrame}/l/${placeId}`;
    return {
        url,
        userData: {
            pageType: timeFrame,
        },
    };
}

/**
 * Extract place id from url.
 *
 * @param {string} urlString
 */
exports.getPlaceIdFromUrl = (urlString) => {
    const url = new URL(urlString);
    const placeId = url.pathname.split('/').pop();
    return placeId;
};

/**
 *
 * @param {*} config
 * @return {Apify.RequestQueue}
 *
 */
exports.initRequestQueue = async ({
    startUrls,
    cities,
    zipCodes,
    units,
    timeFrame,
}) => {
    // parse place ids from start urls
    const startPlaceIds = startUrls.map((urlObject) => this.getPlaceIdFromUrl(urlObject.url));

    // search for places
    const foundCities = await getCities(cities);
    const foundCityPlaceIds = foundCities.map((place) => place.placeId);

    // search for zip codes
    const foundZipCodes = await getZipCodes(zipCodes);
    const foundZipCodePlaceIds = foundZipCodes.map((place) => place.placeId);

    await Apify.setValue('cities', foundCities);
    await Apify.setValue('zipCodes', foundZipCodes);

    // combine all results
    const placeIds = [
        ...startPlaceIds,
        ...foundCityPlaceIds,
        ...foundZipCodePlaceIds,
    ];

    // create request queue
    const requestQueue = await Apify.openRequestQueue();

    // determine which locale to use based on desired units
    const locale = units === 'METRIC' ? 'en-GB' : 'en-US';

    // put all urls to queue
    for (let i = 0; i < placeIds.length; i++) {
        const options = constructWeatherRequestOptions(
            placeIds[i],
            timeFrame,
            locale,
        );
        await requestQueue.addRequest(options);
    }

    return requestQueue;
};

/**
 * Simulate a search on weather.com
 * @param {string} query
 * @returns {Array<object>} Array of relevant places
 */
async function getPlacesBySearchQuery(query) {
    // todo - add error handling
    const response = await requestAsBrowser({
        url: 'https://weather.com/api/v1/p/redux-dal',
        method: 'POST',
        json: true,
        payload: JSON.stringify([
            {
                name: 'getSunV3LocationSearchUrlConfig',
                params: {
                    query,
                    language: 'en-US',
                    locationType: 'locale',
                },
            },
        ]),
    });

    // locate the part of response containing needed data
    const data = response.body.dal.getSunV3LocationSearchUrlConfig;
    const key = Object.keys(data).pop();
    const locationsTable = data[key].data.location;

    // convert to more readable form
    const places = helpers.objectOfArraysToArrayOfObjects(locationsTable);

    return places;
}

/**
 *
 * @param {Array<string>} names
 * @return {Array<object>}
 */
async function getCities(names) {
    const createFilter = (name) => {
        return (place) => {
            return place.city.toLowerCase().includes(name.trim().toLowerCase());
        };
    };
    const result = await getFilteredPlaces(names, createFilter);
    return result;
}

/**
 *
 * @param {Array<string>} codes
 * @return {Array<object>}
 */
async function getZipCodes(codes) {
    const createFilter = (code) => {
        return (place) => {
            return helpers.zipCodeEquals(code, place.postalCode);
        };
    };
    const result = await getFilteredPlaces(codes, createFilter);
    return result;
}

/**
 *
 * @param {Array<string>} searchQueries
 * @param {string => (any, any) => bool} getFilter
 * @return {Array<object>}
 */
async function getFilteredPlaces(searchQueries, creteFilterForQuery) {
    // run all results through map to get rid of duplicities
    const result = new Map();
    for (let i = 0; i < searchQueries.length; i++) {
        const query = searchQueries[i];
        const places = await getPlacesBySearchQuery(query);
        const filter = creteFilterForQuery(query);
        // filter places and append them to result
        places.filter(filter).forEach((place) => {
            result.set(place.placeId, place);
        });
    }
    return Array.from(result.values());
}
