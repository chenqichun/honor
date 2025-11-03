import { PaneRendererCandlesticks, } from '../renderers/candlesticks-renderer';
import { visibleTimedValues } from '../model/time-data';
import { undefinedIfNull } from '../helpers/strict-type-checks'

class SeriesPaneViewBase {
    _series;
    _model;
    _invalidated = true;
    _dataInvalidated = true;
    _optionsInvalidated = true;
    _items = [];
    _itemsVisibleRange = null;
    _extendedVisibleRange;
    constructor(series, model, extendedVisibleRange) {
        this._series = series;
        this._model = model;
        this._extendedVisibleRange = extendedVisibleRange;
    }
    update(updateType) {
        this._invalidated = true;
        if (updateType === 'data') {
            this._dataInvalidated = true;
        }
        if (updateType === 'options') {
            this._optionsInvalidated = true;
        }
    }
    renderer() {
        if (!this._series.visible()) {
            return null;
        }
        this._makeValid();
        return this._itemsVisibleRange === null ? null : this._renderer;
    }
    _updateOptions() {
        this._items = this._items.map((item) => ({
            ...item,
            ...this._series.barColorer().barStyle(item.time),
        }));
    }
    _clearVisibleRange() {
        this._itemsVisibleRange = null;
    }
    _makeValid() {
        if (this._dataInvalidated) {
            this._fillRawPoints();
            this._dataInvalidated = false;
        }
        if (this._optionsInvalidated) {
            this._updateOptions();
            this._optionsInvalidated = false;
        }
        if (this._invalidated) {
            this._makeValidImpl();
            this._invalidated = false;
        }
    }
    _makeValidImpl() {
        const priceScale = this._series.priceScale();
        const timeScale = this._model.timeScale();
        this._clearVisibleRange();
        if (timeScale.isEmpty() || priceScale.isEmpty()) {
            return;
        }
        const visibleBars = timeScale.visibleStrictRange();
        if (visibleBars === null) {
            return;
        }
        if (this._series.bars().size() === 0) {
            return;
        }
        const firstValue = this._series.firstValue();
        if (firstValue === null) {
            return;
        }
        this._itemsVisibleRange = visibleTimedValues(this._items, visibleBars, this._extendedVisibleRange);
     
        this._convertToCoordinates(priceScale, timeScale, firstValue.value);
        this._prepareRendererData();
    }
}

export class SeriesCandlesticksPaneView extends SeriesPaneViewBase {
    _renderer = new PaneRendererCandlesticks();
    constructor(series, model) {
        super(series, model, false);
    }
    _convertToCoordinates(priceScale, timeScale, firstValue) {
        timeScale.indexesToCoordinates(this._items, undefinedIfNull(this._itemsVisibleRange));
        priceScale.barPricesToCoordinates(this._items, firstValue, undefinedIfNull(this._itemsVisibleRange));
    }
    _createDefaultItem(time, bar, colorer) {
        return {
            time: time,
            open: bar.value[0 /* PlotRowValueIndex.Open */],
            high: bar.value[1 /* PlotRowValueIndex.High */],
            low: bar.value[2 /* PlotRowValueIndex.Low */],
            close: bar.value[3 /* PlotRowValueIndex.Close */],
            x: NaN,
            openY: NaN,
            highY: NaN,
            lowY: NaN,
            closeY: NaN,
        };
    }
    _fillRawPoints() {
        const colorer = this._series.barColorer();
        this._items = this._series.bars().rows().map((row) => this._createRawItem(row.index, row, colorer));
    }
    _createRawItem(time, bar, colorer) {
        return {
            ...this._createDefaultItem(time, bar, colorer),
            ...colorer.barStyle(time),
        };
    }
    _prepareRendererData() {
      //  console.log(2222, this._items)
        const candlestickStyleProps = this._series.options();
        this._renderer.setData({
            bars: this._items,
            barSpacing: this._model.timeScale().barSpacing(),
            wickVisible: candlestickStyleProps.wickVisible,
            borderVisible: candlestickStyleProps.borderVisible,
            visibleRange: this._itemsVisibleRange,
        });
    }
}



export const candlestickStyleDefaults = {
    upColor: '#26a69a',
    downColor: '#ef5350',
    wickVisible: true, 
    borderVisible: true,
    borderColor: '#378658',
    borderUpColor: '#000',
    borderDownColor: '#ef5350',
    wickColor: '#000',
    wickUpColor: '#26a69a',
    wickDownColor: 'yellow',
};

const createPaneView = (series, model) => new SeriesCandlesticksPaneView(series, model);
export const createSeries = () => {
    const definition = {
        type: 'Candlestick',
        isBuiltIn: true,
        defaultOptions: candlestickStyleDefaults,
        /**
         * @internal
         */
        createPaneView: createPaneView,
    };
   
    return definition;
};
export const CandlestickSeries = createSeries();
