const Apify = require('apify');
const slugify = require('slugify');
const _ = require('lodash');
const helpers = require('./helpers');

const {
    utils: { log, requestAsBrowser },
} = Apify;

/**
 *
 * All needed data are available from ten day page.
 *
 * @param {object} place
 * @param {string} timeFrame
 * @param {string} locale
 * @return {Apify.RequestOptions}
 */
function createRequestOptions(place, timeFrame, locale) {
    const url = `https://weather.com/${locale}/weather/tenday/l/${place.placeId}`;
    return {
        url,
        userData: {
            place,
        },
    };
}

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
}) => {
    log.info('Initializing request queue.');

    // convert startUrls to place-like objects (with only placeId present)
    const startPlaces = startUrls.map((urlObject) => {
        return { placeId: helpers.getPlaceIdFromUrl(urlObject.url) };
    });

    // search for places
    const foundCities = await getCities(cities);

    // search for zip codes
    const foundZipCodes = await getZipCodes(zipCodes);

    await Apify.setValue('cities', foundCities);
    await Apify.setValue('zipCodes', foundZipCodes);

    // combine all results
    const places = [...startPlaces, ...foundCities, ...foundZipCodes];

    log.info(`Found ${places.length} place(s) to scrape.`);

    // create request queue
    const requestQueue = await Apify.openRequestQueue();

    // determine which locale to use based on desired units
    const locale = units === 'METRIC' ? 'en-CA' : 'en-US';

    // put all places to request queue
    for (let i = 0; i < places.length; i++) {
        const options = createRequestOptions(places[i], locale);
        await requestQueue.addRequest(options);
    }

    log.info('Request queue initialized.');

    return requestQueue;
};

/**
 * Simulate a search on weather.com.
 *
 * @param {string} query
 * @returns {Array<object>} Array of relevant places
 */
async function getPlacesBySearchQuery(query) {
    log.info(`Searching for places using query: ${query}`);
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

    log.debug('Place search api response body', response.body);

    if (
        !response.body.dal
        || !response.body.dal.getSunV3LocationSearchUrlConfig
    ) {
        throw new Error('Place search api returned unknown response');
    }

    // locate the part of response containing needed data
    const data = response.body.dal.getSunV3LocationSearchUrlConfig;
    const key = Object.keys(data).pop();

    if (!data[key] || !data[key].data || !data[key].data.location) {
        throw new Error('Place search api returned unknown response.');
    }

    const locationsTable = data[key].data.location;

    // convert to more readable form
    const places = helpers.objectOfArraysToArrayOfObjects(locationsTable);

    return places;
}

/**
 * Search for places by city names.
 *
 * @param {Array<string>} names
 * @return {Array<object>}
 */
async function getCities(names) {
    const normalizeName = (name) => {
        return slugify(name, { lower: true, replacement: '-' }).split('-');
    };

    const matchNormalizedNames = (a, b) => {
        return _.intersection(a, b).length > 0;
    };

    const createFilter = (name) => {
        const searchName = normalizeName(name);
        return (place) => {
            const placeAddress = normalizeName(place.address);
            const result = matchNormalizedNames(placeAddress, searchName);
            return result;
        };
    };
    const result = await getFilteredPlaces(names, createFilter);
    return result;
}

/**
 * Search for places by zip codes.
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
 * Load places from search api, but only keep those satisfying given conditions.
 *
 * @param {Array<string>} searchQueries
 * @param {string => (any, any) => bool} createFilterForQuery
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
