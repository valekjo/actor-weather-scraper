exports.TIME_FRAME_TODAY = 'today';
exports.TIME_FRAME_HOUR_BY_HOUR = 'hour_by_hour';
exports.TIME_FRAME_TEN_DAYS = 'ten_days';
exports.TIME_FRAME_WEEKEND = 'weekend';
exports.TIME_FRAME_MONTH = 'month';

const TIME_FRAMES = [
    this.TIME_FRAME_TODAY,
    this.TIME_FRAME_HOUR_BY_HOUR,
    this.TIME_FRAME_TEN_DAYS,
    this.TIME_FRAME_WEEKEND,
    this.TIME_FRAME_MONTH,
];

exports.UNITS_METRIC = 'metric';
exports.UNITS_IMPERIAL = 'imperial';

const UNITS = [
    this.UNITS_METRIC,
    this.UNITS_IMPERIAL,
];

/**
 * Validate if given string is a valid timeline.
 *
 * @param {string} timeFrame
 */
exports.validateTimeFrame = (timeFrame) => {
    if (TIME_FRAMES.indexOf(timeFrame) === -1) {
        throw new Error(`${timeFrame} is not a valid time frame`);
    }
};

/**
 * Validate if given string is a valid unit.
 *
 * @param {string} units
 */
exports.validateUnits = (units) => {
    if (UNITS.indexOf(units) === -1) {
        throw new Error(`${units} are not valid units`);
    }
};
