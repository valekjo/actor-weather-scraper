const Apify = require('apify');
const _ = require('lodash');
const helpers = require('./helpers');
const constants = require('./constants');
const page = require('./page');

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
function createRequestOptions(place, locale) {
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
    locations,
    locationIds,
    units,
}) => {
    log.info('Initializing request queue.');

    const directUrls = startUrls.filter((urlObject) => !!urlObject.url);
    const urlFiles = startUrls.filter((urlObject) => !!urlObject.requestsFromUrl);

    // Convert direct startUrls to place-like objects (with only placeId present)
    const startPlaces = directUrls.map((urlObject) => {
        return { placeId: helpers.getPlaceIdFromUrl(urlObject.url) };
    });

    // Append all urls from url files
    for (let i = 0; i < urlFiles.length; i++) {
        const urlObject = urlFiles[i];
        const urls = await getUrlsFromRemoteFile(urlObject.requestsFromUrl);
        startPlaces.push(...urls.map((url) => ({ placeId: helpers.getPlaceIdFromUrl(url) })));
    }

    // Search for places by given locations
    const foundLocations = await getPlacesBySearchQueries(locations);

    // Add specified location ids
    const givenPlaces = locationIds.map((locationId) => {
        return { placeId: locationId };
    });

    // combine all results
    const places = [...startPlaces, ...foundLocations, ...givenPlaces];

    log.info(`Found ${places.length} place(s) to scrape.`);

    // create request queue
    const requestQueue = await Apify.openRequestQueue();

    // determine which locale to use based on desired units
    const locale = units === constants.UNITS_METRIC ? 'en-CA' : 'en-US';

    // put all places to request queue
    for (let i = 0; i < places.length; i++) {
        const options = createRequestOptions(places[i], locale);
        await requestQueue.addRequest(options);
    }

    log.info('Request queue initialized.');

    return requestQueue;
};

/**
 * Load urls from remote text file.
 *
 * @param {String} url
 */
async function getUrlsFromRemoteFile(url) {
    const response = await requestAsBrowser({ url });
    const lines = response.body.split('\n').map((line) => line.trim()).filter((line) => !!line);
    return lines;
}

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
    Apify.setValue('PLACES', places);

    return places;
}

/**
 * Load places from search api, but only keep those satisfying given conditions.
 *
 * @param {Array<string>} searchQueries
 * @return {Array<object>}
 */
async function getPlacesBySearchQueries(searchQueries) {
    // run all results through map to get rid of duplicities
    const result = new Map();
    for (let i = 0; i < searchQueries.length; i++) {
        const query = searchQueries[i];
        const places = await getPlacesBySearchQuery(query);

        // The first place found is taken into account
        const matchingPlace = places.length > 0 && places[0];
        if (matchingPlace) {
            result.set(matchingPlace.placeId, matchingPlace);
        }
    }
    return Array.from(result.values());
}

/**
 * Creates function to handle page.
 *
 * @param {object} param0
 */
exports.createHandlePageFunction = ({ extendOutputFunction, timeFrame }) => {
    return async ({ request, $, response, ...rest }) => {
        log.info(`Scraping url: ${request.url}`);

        // omit all non 200 status code pages
        if (response.statusCode !== 200) {
            log.warning(
                `Url ${request.url} resulted in ${response.statusCode} http code. Omitting.`,
            );
            return;
        }
        try {
            let results = await page.handlePage({ request, $, response, timeFrame, ...rest });

            // try to call extended output function and append the data
            try {
                const userData = extendOutputFunction($);
                if (!helpers.isObject(userData)) {
                    throw new Error(
                        'Extended output function did not return an object.',
                    );
                }
                // combine found and users data
                results = results.map((row) => ({ ...row, ...userData }));
            } catch (e) {
                log.error(`Error in extendedOutputFunction. Error: ${e}`);
            }

            // save all data
            for (let i = 0; i < results.length; i++) {
                await Apify.pushData(results[i]);
            }
        } catch (e) {
            // die in case of unresolved exception
            log.error(
                `Error occurred while processing url: ${request.url}. Shutting down. Error: ${e}`,
                {
                    e,
                },
            );
            process.exit(1);
        }
    };
};
