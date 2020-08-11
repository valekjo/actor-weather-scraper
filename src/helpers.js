/**
 * Convert table-like object-of-arrays locations to array-of-objects with corresponding keys.
 *
 * @param {object} data
 */
exports.objectOfArraysToArrayOfObjects = (data) => {
    const fieldNames = Object.keys(data);
    const anyKey = fieldNames[0];
    const numItems = data[anyKey].length;

    const items = [];

    for (let i = 0; i < numItems; i++) {
        const item = {};
        fieldNames.forEach((field) => {
            item[field] = data[field][i];
        });
        items.push(item);
    }

    return items;
};

exports.getTestIdHierarchySelector = (testIds) => {
    return testIds.map((testId) => `[data-testid="${testId}"]`).join(' ');
};
