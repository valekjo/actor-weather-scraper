const Apify = require('apify');
const tools = require('./tools');
const config = require('./config');

const {
    utils: { log },
} = Apify;

Apify.main(async () => {
    const configuration = await config.getConfig();
    const {
        proxyConfiguration,
        maxRequestsPerCrawl,
    } = configuration;

    const requestQueue = await tools.initRequestQueue(configuration);

    const proxyConfig = await Apify.createProxyConfiguration(
        proxyConfiguration,
    );

    const crawler = new Apify.CheerioCrawler({
        maxRequestsPerCrawl,
        requestQueue,
        handlePageFunction: tools.createHandlePageFunction(configuration),
        proxyConfiguration: proxyConfig,
    });

    log.info('Starting the crawl.');
    await crawler.run();
    log.info('Actor finished.');
});
