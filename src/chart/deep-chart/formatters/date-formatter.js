import {
    numberToStringWithLeadingZero
} from './price-formatter'
const defaultParams = {
    dateFormat: 'yyyy-MM-dd',
    timeFormat: '%h:%m:%s',
    dateTimeSeparator: ' ',
    locale: 'default',
};
import {formatDate} from './formatter-base'

export class DateFormatter {
    _locale;
    _dateFormat;
    constructor(dateFormat = 'yyyy-MM-dd', locale = 'default') {
        this._dateFormat = dateFormat;
        this._locale = locale;
    }
    format(date) {
        return formatDate(date, this._dateFormat, this._locale);
    }
}


export class DateTimeFormatter {
    _dateFormatter;
    _timeFormatter;
    _separator;
    constructor(params = {}) {
        const formatterParams = { ...defaultParams, ...params };
        this._dateFormatter = new DateFormatter(formatterParams.dateFormat, formatterParams.locale);
        this._timeFormatter = new TimeFormatter(formatterParams.timeFormat);
        this._separator = formatterParams.dateTimeSeparator;
    }
    format(dateTime) {
        return `${this._dateFormatter.format(dateTime)}${this._separator}${this._timeFormatter.format(dateTime)}`;
    }
}

export class TimeFormatter {
    _formatStr;
    constructor(format) {
        this._formatStr = format || '%h:%m:%s';
    }
    format(date) {
        return this._formatStr.replace('%h', numberToStringWithLeadingZero(date.getUTCHours(), 2)).
            replace('%m', numberToStringWithLeadingZero(date.getUTCMinutes(), 2)).
            replace('%s', numberToStringWithLeadingZero(date.getUTCSeconds(), 2));
    }
}