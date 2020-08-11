const Apify = require('apify');
const helpers = require('./helpers');

const {
    utils: { log },
} = Apify;

/**
 *
 * @param {*} param0
 * @return {object}
 */
exports.today = async ({ request, $ }) => {
    const details = $(helpers.getTestIdHierarchySelector(['TodaysDetailsModule', 'WeatherDetailsListItem', 'wxData']));

    const results = {
        url: request.url,
        title: $('title').text(),
        temperature: details.eq(0).text(),
        // ... other go as follows
    };

    return results;
};
