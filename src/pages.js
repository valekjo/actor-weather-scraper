const helpers = require('./helpers');

/**
 *
 * @param {*} param0
 * @return {object}
 */
exports.today = async ({ request, $ }) => {
    const summary = $(helpers.getTestIdHierarchySelector(['CurrentConditionsContainer']));
    const details = $(helpers.getTestIdHierarchySelector(['TodaysDetailsModule', 'WeatherDetailsListItem', 'wxData']));

    const location = summary.find('h1').text().replace(/Weather$/, '').trim();
    const time = summary.find('[class*="timestamp"]').text();
    const temperature = summary.find('[class*="tempValue"]').text();

    const results = {
        url: request.url,
        title: $('title').text(),
        location,
        time,
        temperature,
        temperatureHiLo: details.eq(0).text(),
        wind: details.eq(1).text(),
        humidity: details.eq(2).text(),
        // ... other go as follows
    };

    return results;
};
