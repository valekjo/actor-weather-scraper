/**
 * Convert table-like object-of-arrays locations to array-of-objects with corresponding keys.
 *
 * @param {object} data
 * @return {Array<object>}
 */
exports.objectOfArraysToArrayOfObjects = (data) => {
    const fieldNames = Object.keys(data);
    if (fieldNames.length === 0) {
        throw new Error('Object does not have any keys.');
    }
    const anyKey = fieldNames[0];
    const numItems = data[anyKey].length;

    const items = [];

    for (let i = 0; i < numItems; i++) {
        const item = {};
        fieldNames.forEach((field) => {
            if (data[field].length <= i) {
                throw new Error(`Missing entries for fieldName ${field}`);
            }
            item[field] = data[field][i];
        });
        items.push(item);
    }

    return items;
};

/**
 * Converts array of data-testid attributes to actual css selector.
 *
 * @param {Array<string>} testIds
 * @return {string}
 */
exports.getTestIdHierarchySelector = (testIds) => {
    return testIds.map((testId) => `[data-testid="${testId}"]`).join(' ');
};

/**
 * Check if given value is object.
 *
 * @param {any} o
 * @return {boolean}
 */
exports.isObject = (o) => {
    return o !== null && typeof o === 'object' && Array.isArray(o) === false;
};

/**
 * Normalizes zip code to deal with different typing styles.
 *
 * @param {string} zipCode
 * @return {string}
 */
function normalizeZipCode(zipCode) {
    return zipCode.replace(/[^0-9]/g, '');
}

/**
 * Check if the given zip codes are equal.
 *
 * @param {string} a
 * @param {string} b
 * @return {boolean}
 */
exports.zipCodeEquals = (a, b) => {
    return normalizeZipCode(a) === normalizeZipCode(b);
};

/**
 * Extract Weather place id from url.
 *
 * @param {string} urlString
 * @return {string}
 */
exports.getPlaceIdFromUrl = (urlString) => {
    const url = new URL(urlString);
    const placeId = url.pathname.split('/').pop();
    return placeId;
};
