const Apify = require('apify');

/**
 *
 * @param {string} extendOutputFunction
 * @return {function}
 */
const processExtendOutputFunction = (extendOutputFunction) => {
    let func;
    try {
        // eslint-disable-next-line no-eval
        func = eval(extendOutputFunction);
    } catch (e) {
        throw new Error(
            `Extended output function is not valid javascript. Error: ${e}`,
        );
    }
    if (typeof func !== 'function') {
        throw new Error('Extend output function is not a function.');
    }
    return func;
};

exports.getConfig = async () => {
    const input = await Apify.getInput();
    const { startUrls, proxyConfiguration, extendOutputFunction, maxItems, units, timeFrame } = input;

    // convert extend output function from string to function
    const evaluatedExtendOutputFunction = processExtendOutputFunction(
        extendOutputFunction,
    );

    const maxRequestsPerCrawl = maxItems > 0 ? maxItems : undefined;

    return {
        startUrls,
        proxyConfiguration,
        extendOutputFunction: evaluatedExtendOutputFunction,
        maxRequestsPerCrawl,
        units,
        timeFrame,
    };
};
