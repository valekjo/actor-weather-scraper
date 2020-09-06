const Apify = require('apify');

const { utils: { log } } = Apify;

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
 * Check if given value is object.
 *
 * @param {any} o
 * @return {boolean}
 */
exports.isObject = (o) => {
    return o !== null && typeof o === 'object' && Array.isArray(o) === false;
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

/**
 * This is the most fragile part of an actor, as it makes strong assumptions about
 * javascript contained in page structure.
 *
 * @param {string} data
 * @returns {Array|object}
 */
exports.parseWindowDataScript = (data) => {
    try {
        let jsonData = data.replace(/^(window\.__data=.*;)\s*window\..*$/, '$1');
        // some cases need double parsing
        if (jsonData.startsWith('window.__data=JSON.parse')) {
            jsonData = jsonData.replace(/^window.__data=JSON.parse\((.*)\);$/, '$1');
            return JSON.parse(JSON.parse(jsonData));
        }
        jsonData = jsonData.replace(/^window.__data=(.*);$/, '$1');
        return JSON.parse(jsonData);
    } catch (e) {
        log.error(`${e}`);
        log.error('Unable to parse site script, most likely due to change of structure.');
        throw e;
    }
};

/**
 * Extract `window.__data` from javascript code on page.
 *
 * @param {JQueryStatic} $
 */
exports.getWindowData = ($) => {
    // load data script from page
    const dataScript = $('script').filter((i, scriptEl) => {
        if (scriptEl.children.length === 0) {
            return false;
        }
        const { data } = scriptEl.children[0];
        return data.startsWith('window.__data=');
    }).get()[0].children[0].data;
    const data = this.parseWindowDataScript(dataScript);
    return data;
};

/**
 *
 * @param {*} data
 */
exports.getObjectFirstKey = (data) => {
    const keys = Object.keys(data);
    if (keys.length === 0) {
        throw new Error('Object does not have a single key');
    }
    const key = keys[0];
    return data[key];
};
