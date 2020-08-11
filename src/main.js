const Apify = require('apify');
const tools = require('./tools');
const config = require('./config');
const pages = require('./pages');

const {
    utils: { log },
} = Apify;

Apify.main(async () => {
    const {
        startUrls,
        proxyConfiguration,
        extendOutputFunction,
        maxRequestsPerCrawl,
        units,
        timeFrame,
    } = await config.getConfig();

    log.info('Preparing request queue');
    const requestQueue = await tools.initRequestQueue({
        startUrls,
        searchQuery: '11000',
        units,
        timeFrame,
    });

    // create proxy configuration
    const proxyConfig = await Apify.createProxyConfiguration(
        proxyConfiguration,
    );

    log.debug('Setting up crawler.');
    const crawler = new Apify.CheerioCrawler({
        maxRequestsPerCrawl,
        requestQueue,
        handlePageFunction: async ({ request, $, ...rest }) => {
            const { pageType } = request.userData;
            try {
                const pageFunction = pages[pageType];
                let data = await pageFunction({ request, $, ...rest });

                try {
                    const userData = extendOutputFunction($);
                    // todo - check if userData are really an object
                    data = { ...data, ...userData };
                } catch (e) {
                    log.error(
                        `Extended output function threw error. Error: ${e}`,
                    );
                }

                Apify.pushData(data);
            } catch (e) {
                log.error(
                    `Error occurred while processing url: ${request.url}. Shutting down. Error: ${e}`,
                );
                process.exit();
            }
        },
        proxyConfiguration: proxyConfig,
    });

    log.info('Starting the crawl.');
    await crawler.run();
    log.info('Actor finished.');
});
