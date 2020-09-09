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
 */
exports.initRequestQueue = async ({
    startUrls,
    locations,
    locationIds,
    units,
}) => {
    log.info('Initializing request queue.');
    // Convert start urls to RequestList in order to resolve bulk load urls
    const requestList = new Apify.RequestList({
        sources: startUrls,
    });
    await requestList.initialize();

    // Convert RequestList to list of locations
    const urlPlaces = [];
    while (!(await requestList.isEmpty())) {
        const request = await requestList.fetchNextRequest();
        urlPlaces.push({
            placeId: helpers.getPlaceIdFromUrl(request.url),
        });
    }

    // Search for locations by given search strings
    const searchPlaces = await getPlacesBySearchQueries(locations);

    // Add specified location ids
    const givenPlaces = locationIds.map((locationId) => {
        return { placeId: locationId };
    });

    // Combine all locations together
    const crawlPlaces = urlPlaces.length > 0 ? urlPlaces : [...searchPlaces, ...givenPlaces];

    log.info(`Found ${crawlPlaces.length} location(s) to scrape.`);

    // create request queue
    const requestQueue = await Apify.openRequestQueue();

    // determine which locale to use based on desired units
    const locale = units === constants.UNITS_METRIC ? 'en-CA' : 'en-US';

    // put all places to request queue
    for (let i = 0; i < crawlPlaces.length; i++) {
        const options = createRequestOptions(crawlPlaces[i], locale);
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
        log.info(`Search for: ${query} did not return usable results, skipping`);
        return [];
    }

    // Locate the part of response containing needed data
    const data = response.body.dal.getSunV3LocationSearchUrlConfig;
    const key = Object.keys(data).pop();

    if (!data[key] || !data[key].data || !data[key].data.location) {
        log.info(`Search for: ${query} did not return usable results, skipping`);
        return [];
    }

    const locationsTable = data[key].data.location;

    // Convert to more readable form
    const places = helpers.objectOfArraysToArrayOfObjects(locationsTable);
    return places;
}

/**
 * Load locations from weather search api.
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

        // Omit all non 200 status code pages
        if (response.statusCode !== 200) {
            log.warning(
                `Url ${request.url} resulted in ${response.statusCode} http code. Omitting.`,
            );
            return;
        }
        try {
            let results = await page.handlePage({ request, $, response, timeFrame, ...rest });

            // Try to call extended output function if provided and append the data
            if (extendOutputFunction) {
                try {
                    const userData = extendOutputFunction($);
                    if (!helpers.isObject(userData)) {
                        throw new Error(
                            'Extended output function did not return an object.',
                        );
                    }
                    // Combine found and users data
                    results = results.map((row) => ({ ...row, ...userData }));
                } catch (e) {
                    log.error(`Error in extendedOutputFunction. Error: ${e}`);
                }
            }

            // Save all data
            await Apify.pushData(results);
        } catch (e) {
            // Die in case of unresolved exception
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
