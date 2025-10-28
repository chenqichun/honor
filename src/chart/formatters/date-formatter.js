import { formatDate } from './format-date';
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
