const Apify = require('apify');
const helpers = require('./helpers');

const {
    utils: { log, requestAsBrowser },
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
exports.initRequestQueue = async ({ startUrls, searchQuery, units, timeFrame }) => {
    // get all relevant place ids
    const startPlaceIds = startUrls.map((urlObject) => this.getPlaceIdFromUrl(urlObject.url));
    const foundPlaces = await this.getPlacesByQuery(searchQuery);
    const foundPlaceIds = foundPlaces.map((place) => place.placeId);
    const placeIds = [...startPlaceIds, ...foundPlaceIds];

    const requestQueue = await Apify.openRequestQueue();

    // select the correct locale for specified units
    const locale = units === 'C' ? 'en-UK' : 'en-US';

    // put all their urls to queue
    for (let i = 0; i < placeIds.length; i++) {
        const options = constructWeatherRequestOptions(placeIds[i], timeFrame, locale);
        await requestQueue.addRequest(options);
    }

    return requestQueue;
};

/**
 * Simulate a search on weather.com
 * @param {string} query
 * @returns {Array<object>} Array of relevant places
 */
exports.getPlacesByQuery = async (query) => {
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
};
