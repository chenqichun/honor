import { ensureNotNull } from '../../helpers/assertions';
import { notNull } from '../../helpers/strict-type-checks';
import { MarkersPrimitiveRenderer } from './renderer';
function isAreaStyleOptions(opts, seriesType) {
    return seriesType === 'Area';
}
function getNeutralColor(opts, seriesType) {
    if (isAreaStyleOptions(opts, seriesType)) {
        return opts.lineColor;
    }
    return opts.color;
}
export class MarkersPrimitivePaneView {
    _series;
    _timeScale;
    _options;
    _data = [];
    constructor(series, timeScale, options) {
        this._series = series;
        this._timeScale = timeScale;
        this._options = options;
    }
    update(markers) {
        this._data = markers.map((marker) => {
            const y = this._series.priceToCoordinate(marker.value);
            if (y === null) {
                return null;
            }
            const x = ensureNotNull(this._timeScale.timeToCoordinate(marker.time));
            return {
                x,
                y,
                sign: marker.sign,
            };
        })
            .filter(notNull);
    }
    renderer() {
        const options = this._series.options();
        const seriesType = this._series.seriesType();
        const neutralColor = getNeutralColor(options, seriesType);
        return new MarkersPrimitiveRenderer(this._data, neutralColor, this._options.negativeColor, this._options.positiveColor);
    }
}
