const Apify = require('apify');
const constants = require('./constants');

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
 *
 * @returns {object}
 */
exports.getConfig = async () => {
    const input = await Apify.getInput();
    const { extendOutputFunction, maxItems, zipCodes, cities, units, startUrls, timeFrame } = input;

    // convert extend output function from string to function
    const evaluatedExtendOutputFunction = processExtendOutputFunction(
        extendOutputFunction,
    );

    constants.validateTimeFrame(timeFrame);

    const validUnits = units || constants.UNITS_METRIC;
    constants.validateUnits(validUnits);

    return {
        ...input,
        extendOutputFunction: evaluatedExtendOutputFunction,
        maxRequestsPerCrawl: maxItems > 0 ? maxItems : undefined,
        startUrls: startUrls || [],
        zipCodes: zipCodes || [],
        cities: cities || [],
        units: validUnits,
        timeFrame,
    };
};
