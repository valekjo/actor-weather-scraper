const helpers = require('./helpers');
const constants = require('./constants');

/**
 * Extract location info from full page data.
 *
 * @param {object} fullData
 * @return {object}
 */
function getLocation(fullData) {
    const locationData = helpers.getObjectFirstKey(fullData.dal.getSunV3LocationPointUrlConfig);
    const { city, adminDistrict, postalCode, country, placeId } = locationData.data.location;

    return {
        city,
        state: adminDistrict,
        country,
        zipCode: postalCode,
        locationId: placeId,
    };
}

const FORECAST_TYPE_DAILY = 'daily';
const FORECAST_TYPE_HOURLY = 'hourly';
const FORECAST_TYPE_CURRENT = 'current';

/**
 * Extract forecasts from from full page data based on which type of forecast is required.
 *
 * @param {object} fullData
 * @param {'daily'|'current'|'hourly'} forecastType
 * @return {Array<object>}
 */
function getForecastsByType(fullData, forecastType) {
    if (forecastType === FORECAST_TYPE_CURRENT) {
        const data = helpers.getObjectFirstKey(fullData.dal.getSunV3CurrentObservationsUrlConfig);
        return [getSingleForecast(data.data)];
    }
    if (forecastType === FORECAST_TYPE_HOURLY) {
        const data = helpers.getObjectFirstKey(fullData.dal.getSunV3HourlyForecastUrlConfig);
        const rawForecasts = helpers.objectOfArraysToArrayOfObjects(data.data);
        return rawForecasts.map(getSingleForecast);
    }
    if (forecastType === FORECAST_TYPE_DAILY) {
        const data = helpers.getObjectFirstKey(fullData.dal.getSunV3DailyForecastWithHeadersUrlConfig);
        return getDailyForecasts(data.data);
    }

    throw new Error(`Unknown time frame ${forecastType}`);
}

/**
 * Extract daily forecasts from already processed data.
 * Daily forecasts contain information on day / night weather - this function combines them.
 *
 * @param {object} data
 * @return {Array<object>}
 */
function getDailyForecasts(data) {
    const dayPartForecast = helpers.objectOfArraysToArrayOfObjects(
        data.daypart[0],
    );
    delete data.daypart;

    const rawForecasts = helpers.objectOfArraysToArrayOfObjects(data);

    const forecasts = [];

    for (let i = 0; i < rawForecasts.length; i++) {
        const day = dayPartForecast[i * 2];
        const night = dayPartForecast[i * 2 + 1];
        const forecast = rawForecasts[i];
        forecasts.push({
            time: forecast.validTimeLocal,
            temperature: `${day.temperature}/${night.temperature}`,
            forecast: `${day.wxPhraseLong}/${night.wxPhraseLong}`,
            humidity: `${day.relativeHumidity}/${night.relativeHumidity}`,
            windDirection: `${day.windDirectionCardinal}/${night.windDirectionCardinal}`,
            windSpeed: `${day.windSpeed}/${night.windSpeed}`,
        });
    }

    return forecasts;
}

/**
 * Transforms forecast in 'daily' and 'current' format to output format.
 *
 * @param {object} param0
 * @return {object}
 */
function getSingleForecast({
    temperature,
    validTimeLocal,
    wxPhraseLong,
    relativeHumidity,
    windDirectionCardinal,
    windSpeed,
}) {
    return {
        time: validTimeLocal,
        temperature,
        forecast: wxPhraseLong,
        humidity: relativeHumidity,
        windDirection: windDirectionCardinal,
        windSpeed,
    };
}

/**
 * All needed data are available in `window.__data` assigned in header scripts.
 *
 * @param {*} param0
 * @return {object}
 */
exports.handlePage = async ({ timeFrame, $ }) => {
    const fullData = helpers.getWindowData($);

    const location = getLocation(fullData);

    // each time frame requires specific set of forecasts
    const timeFrameToForecastType = {
        [constants.TIME_FRAME_HOUR_BY_HOUR]: FORECAST_TYPE_HOURLY,
        [constants.TIME_FRAME_TODAY]: FORECAST_TYPE_CURRENT,
        [constants.TIME_FRAME_TEN_DAYS]: FORECAST_TYPE_DAILY,
        [constants.TIME_FRAME_WEEKEND]: FORECAST_TYPE_DAILY,
        [constants.TIME_FRAME_MONTH]: FORECAST_TYPE_DAILY,
    };
    let forecasts = getForecastsByType(fullData, timeFrameToForecastType[timeFrame]);

    // get only first ten forecasts
    if (timeFrame === constants.TIME_FRAME_TEN_DAYS) {
        forecasts = forecasts.slice(0, 10);
    }

    // get all available weekend forecasts (might be more than 2 results)
    if (timeFrame === constants.TIME_FRAME_WEEKEND) {
        forecasts = forecasts.filter((forecast) => {
            const date = new Date(forecast.time);
            const weekday = date.getDay();
            return weekday === 0 || weekday === 6;
        });
    }

    // attach location info to all results
    const results = forecasts.map((forecast) => ({ ...location, ...forecast }));
    return results;
};
