const Apify = require('apify');
const tools = require('./tools');
const config = require('./config');
const page = require('./page');
const helpers = require('./helpers');

const {
    utils: { log },
} = Apify;

Apify.main(async () => {
    const configuration = await config.getConfig();
    const {
        proxyConfiguration,
        extendOutputFunction,
        maxRequestsPerCrawl,
        timeFrame,
    } = configuration;

    const requestQueue = await tools.initRequestQueue(configuration);

    const proxyConfig = await Apify.createProxyConfiguration(
        proxyConfiguration,
    );

    log.debug('Setting up crawler.');
    const crawler = new Apify.CheerioCrawler({
        maxRequestsPerCrawl,
        requestQueue,
        handlePageFunction: createHandlePageFunction({ extendOutputFunction, timeFrame }),
        proxyConfiguration: proxyConfig,
    });

    log.info('Starting the crawl.');
    await crawler.run();
    log.info('Actor finished.');
});

function createHandlePageFunction({ extendOutputFunction, timeFrame }) {
    return async ({ request, $, response, ...rest }) => {
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
            );
            process.exit(1);
        }
    };
}
