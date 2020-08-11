const Apify = require('apify');
const tools = require('./tools');
const config = require('./config');
const pages = require('./pages');
const helpers = require('./helpers');

const {
    utils: { log },
} = Apify;

function createHandlePageFunction({ extendOutputFunction }) {
    return async ({ request, $, response, ...rest }) => {
        // omit all non 200 status code pages
        if (response.statusCode !== 200) {
            log.warning(`Url ${request.url} resulted in ${response.statusCode} http code. Omitting.`);
            return;
        }
        try {
            // determine which page handler to call
            const { pageType } = request.userData;
            const pageFunction = pages[pageType];
            let data = await pageFunction({ request, $, response, ...rest });

            // try to call extended output function and append the data
            try {
                const userData = extendOutputFunction($);
                if (!helpers.isObject(userData)) {
                    throw new Error('Extended output function did not return an object.');
                }
                // combine default and users data
                data = { ...data, ...userData };
            } catch (e) {
                log.error(`Error in extendedOutputFunction. Error: ${e}`);
            }

            Apify.pushData(data);
        } catch (e) {
            // die in case of unresolved exception
            log.error(
                `Error occurred while processing url: ${request.url}. Shutting down. Error: ${e}`,
            );
            process.exit(1);
        }
    };
}

Apify.main(async () => {
    const configuration = await config.getConfig();
    const {
        proxyConfiguration,
        extendOutputFunction,
        maxRequestsPerCrawl,
    } = configuration;

    log.info('Preparing request queue');
    const requestQueue = await tools.initRequestQueue(configuration);

    const proxyConfig = await Apify.createProxyConfiguration(
        proxyConfiguration,
    );

    log.debug('Setting up crawler.');
    const crawler = new Apify.CheerioCrawler({
        maxRequestsPerCrawl,
        requestQueue,
        handlePageFunction: createHandlePageFunction({ extendOutputFunction }),
        proxyConfiguration: proxyConfig,
    });

    log.info('Starting the crawl.');
    await crawler.run();
    log.info('Actor finished.');
});
