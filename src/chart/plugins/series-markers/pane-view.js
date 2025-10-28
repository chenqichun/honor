import { ensureNever, ensureNotNull } from '../../helpers/assertions';
import { isNumber } from '../../helpers/strict-type-checks';
import { RangeImpl } from '../../model/range-impl';
import { visibleTimedValues } from '../../model/time-data';
import { SeriesMarkersRenderer, } from './renderer';
import { calculateShapeHeight, shapeMargin as calculateShapeMargin, } from './utils';
function isPriceMarker(position) {
    return position === 'atPriceTop' || position === 'atPriceBottom' || position === 'atPriceMiddle';
}
function getPrice(seriesData, marker, isInverted) {
    if (isPriceMarker(marker.position) && marker.price !== undefined) {
        return marker.price;
    }
    if (isValueData(seriesData)) {
        return seriesData.value;
    }
    if (isOhlcData(seriesData)) {
        if (marker.position === 'inBar') {
            return seriesData.close;
        }
        if (marker.position === 'aboveBar') {
            if (!isInverted) {
                return seriesData.high;
            }
            return seriesData.low;
        }
        if (marker.position === 'belowBar') {
            if (!isInverted) {
                return seriesData.low;
            }
            return seriesData.high;
        }
    }
    return;
}
// eslint-disable-next-line max-params, complexity
function fillSizeAndY(rendererItem, marker, seriesData, offsets, textHeight, shapeMargin, series, chart) {
    const price = getPrice(seriesData, marker, series.priceScale().options().invertScale);
    if (price === undefined) {
        return;
    }
    const ignoreOffset = isPriceMarker(marker.position);
    const timeScale = chart.timeScale();
    const sizeMultiplier = isNumber(marker.size) ? Math.max(marker.size, 0) : 1;
    const shapeSize = calculateShapeHeight(timeScale.options().barSpacing) * sizeMultiplier;
    const halfSize = shapeSize / 2;
    rendererItem.size = shapeSize;
    const position = marker.position;
    switch (position) {
        case 'inBar':
        case 'atPriceMiddle': {
            rendererItem.y = ensureNotNull(series.priceToCoordinate(price));
            if (rendererItem.text !== undefined) {
                rendererItem.text.y = rendererItem.y + halfSize + shapeMargin + textHeight * (0.5 + 0.1 /* Constants.TextMargin */);
            }
            return;
        }
        case 'aboveBar':
        case 'atPriceTop': {
            const offset = ignoreOffset ? 0 : offsets.aboveBar;
            rendererItem.y = (ensureNotNull(series.priceToCoordinate(price)) - halfSize - offset);
            if (rendererItem.text !== undefined) {
                rendererItem.text.y = rendererItem.y - halfSize - textHeight * (0.5 + 0.1 /* Constants.TextMargin */);
                offsets.aboveBar += textHeight * (1 + 2 * 0.1 /* Constants.TextMargin */);
            }
            if (!ignoreOffset) {
                offsets.aboveBar += shapeSize + shapeMargin;
            }
            return;
        }
        case 'belowBar':
        case 'atPriceBottom': {
            const offset = ignoreOffset ? 0 : offsets.belowBar;
            rendererItem.y = (ensureNotNull(series.priceToCoordinate(price)) + halfSize + offset);
            if (rendererItem.text !== undefined) {
                rendererItem.text.y = (rendererItem.y + halfSize + shapeMargin + textHeight * (0.5 + 0.1 /* Constants.TextMargin */));
                offsets.belowBar += textHeight * (1 + 2 * 0.1 /* Constants.TextMargin */);
            }
            if (!ignoreOffset) {
                offsets.belowBar += shapeSize + shapeMargin;
            }
            return;
        }
    }
    ensureNever(position);
}
function isValueData(data) {
    // eslint-disable-next-line no-restricted-syntax
    return 'value' in data && typeof data.value === 'number';
}
function isOhlcData(data) {
    // eslint-disable-next-line no-restricted-syntax
    return 'open' in data && 'high' in data && 'low' in data && 'close' in data;
}
export class SeriesMarkersPaneView {
    _series;
    _chart;
    _data;
    _markers = [];
    _options;
    _invalidated = true;
    _dataInvalidated = true;
    _renderer = new SeriesMarkersRenderer();
    constructor(series, chart, options) {
        this._series = series;
        this._chart = chart;
        this._data = {
            items: [],
            visibleRange: null,
        };
        this._options = options;
    }
    renderer() {
        if (!this._series.options().visible) {
            return null;
        }
        if (this._invalidated) {
            this._makeValid();
        }
        const layout = this._chart.options()['layout'];
        this._renderer.setParams(layout.fontSize, layout.fontFamily, this._options.zOrder);
        this._renderer.setData(this._data);
        return this._renderer;
    }
    setMarkers(markers) {
        this._markers = markers;
        this.update('data');
    }
    update(updateType) {
        this._invalidated = true;
        if (updateType === 'data') {
            this._dataInvalidated = true;
        }
    }
    updateOptions(options) {
        this._invalidated = true;
        this._options = options;
    }
    zOrder() {
        return this._options.zOrder === 'aboveSeries' ? 'top' : this._options.zOrder;
    }
    _makeValid() {
        const timeScale = this._chart.timeScale();
        const seriesMarkers = this._markers;
        if (this._dataInvalidated) {
            this._data.items = seriesMarkers.map((marker) => ({
                time: marker.time,
                x: 0,
                y: 0,
                size: 0,
                shape: marker.shape,
                color: marker.color,
                externalId: marker.id,
                internalId: marker.internalId,
                text: undefined,
            }));
            this._dataInvalidated = false;
        }
        const layoutOptions = this._chart.options()['layout'];
        this._data.visibleRange = null;
        const visibleBars = timeScale.getVisibleLogicalRange();
        if (visibleBars === null) {
            return;
        }
        const visibleBarsRange = new RangeImpl(Math.floor(visibleBars.from), Math.ceil(visibleBars.to));
        const firstValue = this._series.data()[0];
        if (firstValue === null) {
            return;
        }
        if (this._data.items.length === 0) {
            return;
        }
        let prevTimeIndex = NaN;
        const shapeMargin = calculateShapeMargin(timeScale.options().barSpacing);
        const offsets = {
            aboveBar: shapeMargin,
            belowBar: shapeMargin,
        };
        this._data.visibleRange = visibleTimedValues(this._data.items, visibleBarsRange, true);
        for (let index = this._data.visibleRange.from; index < this._data.visibleRange.to; index++) {
            const marker = seriesMarkers[index];
            if (marker.time !== prevTimeIndex) {
                // new bar, reset stack counter
                offsets.aboveBar = shapeMargin;
                offsets.belowBar = shapeMargin;
                prevTimeIndex = marker.time;
            }
            const rendererItem = this._data.items[index];
            rendererItem.x = ensureNotNull(timeScale.logicalToCoordinate(marker.time));
            if (marker.text !== undefined && marker.text.length > 0) {
                rendererItem.text = {
                    content: marker.text,
                    x: 0,
                    y: 0,
                    width: 0,
                    height: 0,
                };
            }
            const dataAt = this._series.dataByIndex(marker.time, 0 /* MismatchDirection.None */);
            if (dataAt === null) {
                continue;
            }
            fillSizeAndY(rendererItem, marker, dataAt, offsets, layoutOptions.fontSize, shapeMargin, this._series, this._chart);
        }
        this._invalidated = false;
    }
}
