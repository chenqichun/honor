import { DateFormatter } from './date-formatter';
import { TimeFormatter } from './time-formatter';
const defaultParams = {
    dateFormat: 'yyyy-MM-dd',
    timeFormat: '%h:%m:%s',
    dateTimeSeparator: ' ',
    locale: 'default',
};
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
