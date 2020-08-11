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

/**
 * Load and validate input configuration.
 */
exports.getConfig = async () => {
    const input = await Apify.getInput();
    const { extendOutputFunction, maxItems, zipCodes, cities, units } = input;

    // convert extend output function from string to function
    const evaluatedExtendOutputFunction = processExtendOutputFunction(
        extendOutputFunction,
    );

    const maxRequestsPerCrawl = maxItems > 0 ? maxItems : undefined;

    return {
        ...input,
        extendOutputFunction: evaluatedExtendOutputFunction,
        maxRequestsPerCrawl,
        zipCodes: zipCodes || [],
        cities: cities || [],
        units: units || 'METRIC',
    };
};
