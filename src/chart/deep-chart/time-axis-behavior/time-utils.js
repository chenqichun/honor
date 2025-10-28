
import { 
  isString,
  ensureNever,
  isNumber
 } from '../utils/common';

export function isBusinessDay(time) {
    return !isNumber(time) && !isString(time);
}

export function isUTCTimestamp(time) {
    return isNumber(time);
}

export function businessDayConverter(time) {
    let businessDay = time;
    if (isString(time)) {
        businessDay = stringToBusinessDay(time);
    }
    if (!isBusinessDay(businessDay)) {
        throw new Error('time must be of type BusinessDay');
    }
    const date = new Date(Date.UTC(businessDay.year, businessDay.month - 1, businessDay.day, 0, 0, 0, 0));
    return {
        timestamp: Math.round(date.getTime() / 1000),
        businessDay,
    };
}
export function timestampConverter(time) {
    if (!isUTCTimestamp(time)) {
        throw new Error('time must be of type isUTCTimestamp');
    }
    return {
        timestamp: time,
    };
}
export function selectTimeConverter(data) {
    if (data.length === 0) {
        return null;
    }
    if (isBusinessDay(data[0].time) || isString(data[0].time)) {
        return businessDayConverter;
    }
    return timestampConverter;
}
const validDateRegex = /^\d\d\d\d-\d\d-\d\d$/;
export function convertTime(time) {
    if (isUTCTimestamp(time)) {
        return timestampConverter(time);
    }
    if (!isBusinessDay(time)) {
        return businessDayConverter(stringToBusinessDay(time));
    }
    return businessDayConverter(time);
}
export function stringToBusinessDay(value) {
    if (process.env.NODE_ENV === 'development') {
        // in some browsers (I look at your Chrome) the Date constructor may accept invalid date string
        // but parses them in 'implementation specific' way
        // for example 2019-1-1 isn't the same as 2019-01-01 (for Chrome both are 'valid' date strings)
        // see https://bugs.chromium.org/p/chromium/issues/detail?id=968939
        // so, we need to be sure that date has valid format to avoid strange behavior and hours of debugging
        // but let's do this in development build only because of perf
        if (!validDateRegex.test(value)) {
            throw new Error(`Invalid date string=${value}, expected format=yyyy-mm-dd`);
        }
    }
    const d = new Date(value);
    if (isNaN(d.getTime())) {
        throw new Error(`Invalid date string=${value}, expected format=yyyy-mm-dd`);
    }
    return {
        day: d.getUTCDate(),
        month: d.getUTCMonth() + 1,
        year: d.getUTCFullYear(),
    };
}
export function convertStringToBusinessDay(value) {
    if (isString(value.time)) {
        value.time = stringToBusinessDay(value.time);
    }
}
export function convertStringsToBusinessDays(data) {
    return data.forEach(convertStringToBusinessDay);
}

function hours(count) {
    return count * 60 * 60 * 1000;
}
function minutes(count) {
    return count * 60 * 1000;
}
function seconds(count) {
    return count * 1000;
}
const intradayWeightDivisors = [
    { divisor: seconds(1), weight: 10 /* TickMarkWeight.Second */ },
    { divisor: minutes(1), weight: 20 /* TickMarkWeight.Minute1 */ },
    { divisor: minutes(5), weight: 21 /* TickMarkWeight.Minute5 */ },
    { divisor: minutes(30), weight: 22 /* TickMarkWeight.Minute30 */ },
    { divisor: hours(1), weight: 30 /* TickMarkWeight.Hour1 */ },
    { divisor: hours(3), weight: 31 /* TickMarkWeight.Hour3 */ },
    { divisor: hours(6), weight: 32 /* TickMarkWeight.Hour6 */ },
    { divisor: hours(12), weight: 33 /* TickMarkWeight.Hour12 */ },
];
function weightByTime(currentDate, prevDate) {
    if (currentDate.getUTCFullYear() !== prevDate.getUTCFullYear()) {
        return 70 /* TickMarkWeight.Year */;
    }
    else if (currentDate.getUTCMonth() !== prevDate.getUTCMonth()) {
        return 60 /* TickMarkWeight.Month */;
    }
    else if (currentDate.getUTCDate() !== prevDate.getUTCDate()) {
        return 50 /* TickMarkWeight.Day */;
    }
    for (let i = intradayWeightDivisors.length - 1; i >= 0; --i) {
        if (Math.floor(prevDate.getTime() / intradayWeightDivisors[i].divisor) !== Math.floor(currentDate.getTime() / intradayWeightDivisors[i].divisor)) {
            return intradayWeightDivisors[i].weight;
        }
    }
    return 0 /* TickMarkWeight.LessThanSecond */;
}
function cast(t) {
    return t;
}
export function fillWeightsForPoints(sortedTimePoints, startIndex = 0) {
    if (sortedTimePoints.length === 0) {
        return;
    }
    let prevTime = startIndex === 0 ? null : cast(sortedTimePoints[startIndex - 1].time).timestamp;
    let prevDate = prevTime !== null ? new Date(prevTime * 1000) : null;
    let totalTimeDiff = 0;
    for (let index = startIndex; index < sortedTimePoints.length; ++index) {
        const currentPoint = sortedTimePoints[index];
        const currentDate = new Date(cast(currentPoint.time).timestamp * 1000);
        if (prevDate !== null) {
            currentPoint.timeWeight = weightByTime(currentDate, prevDate);
        }
        totalTimeDiff += cast(currentPoint.time).timestamp - (prevTime || cast(currentPoint.time).timestamp);
        prevTime = cast(currentPoint.time).timestamp;
        prevDate = currentDate;
    }
    if (startIndex === 0 && sortedTimePoints.length > 1) {
        // let's guess a weight for the first point
        // let's say the previous point was average time back in the history
        const averageTimeDiff = Math.ceil(totalTimeDiff / (sortedTimePoints.length - 1));
        const approxPrevDate = new Date((cast(sortedTimePoints[0].time).timestamp - averageTimeDiff) * 1000);
        sortedTimePoints[0].timeWeight = weightByTime(new Date(cast(sortedTimePoints[0].time).timestamp * 1000), approxPrevDate);
    }
}


export function defaultTickMarkFormatter(timePoint, tickMarkType, locale) {
    const formatOptions = {};
    switch (tickMarkType) {
        case 0 /* TickMarkType.Year */:
            formatOptions.year = 'numeric';
            break;
        case 1 /* TickMarkType.Month */:
            formatOptions.month = 'short';
            break;
        case 2 /* TickMarkType.DayOfMonth */:
            formatOptions.day = 'numeric';
            break;
        case 3 /* TickMarkType.Time */:
            formatOptions.hour12 = false;
            formatOptions.hour = '2-digit';
            formatOptions.minute = '2-digit';
            break;
        case 4 /* TickMarkType.TimeWithSeconds */:
            formatOptions.hour12 = false;
            formatOptions.hour = '2-digit';
            formatOptions.minute = '2-digit';
            formatOptions.second = '2-digit';
            break;
        default:
            ensureNever(tickMarkType);
    }
    const date = timePoint.businessDay === undefined
        ? new Date(timePoint.timestamp * 1000)
        : new Date(Date.UTC(timePoint.businessDay.year, timePoint.businessDay.month - 1, timePoint.businessDay.day));
    // from given date we should use only as UTC date or timestamp
    // but to format as locale date we can convert UTC date to local date
    const localDateFromUtc = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds());
    return localDateFromUtc.toLocaleString(locale, formatOptions);
}

export function markWithGreaterWeight(a, b) {
    return a.weight > b.weight ? a : b;
}