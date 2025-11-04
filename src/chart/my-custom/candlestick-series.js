
import { visibleTimedValues } from '../model/time-data';
import { undefinedIfNull } from '../helpers/strict-type-checks'



import { fillRectInnerBorder } from '../helpers/canvas-helpers';
import { optimalCandlestickWidth } from '../renderers/optimal-bar-width';

export class PaneRendererCandlesticks  {
    _data = null;
    // scaled with pixelRatio
    _barWidth = 0;
    draw(target, isHovered, hitTestData) {
        /**
         * target是一个CanvasRenderingTarget2D对象
         * _bitmapSize是根据devicePixelRatio的尺寸，即_bitmapSize = _mediaSize * devicePixelRatio
         * _mediaSize 是元素尺寸
         */
        target.useBitmapCoordinateSpace((scope) => {
            /**scope 返回画布的一些缩放，尺寸，画布
             * 
             */
            this._drawImpl(scope, isHovered, hitTestData)
        });
    }
    setData(data) {
        this._data = data;
        /*
            barSpacing  -- 整个柱子的宽度（包含留白），也可以理解成两根柱子中间线之间的距离,可以是小数
            bars -- k线数据格式后的数据
            visibleRange -- {from, to} 可视范围
            wickVisible -- 
        */
    }
    _drawImpl(renderingScope) {
       // console.log(1111, this._data)
        if (this._data === null || this._data.bars.length === 0 || this._data.visibleRange === null) {
            return;
        }
        const { horizontalPixelRatio } = renderingScope;
    
        // this._data.barSpacing 是整个柱子的宽度（包括留白），可以是小数
        // this._barWidth 是柱子实体宽度，整数
        this._barWidth = optimalCandlestickWidth(this._data.barSpacing, horizontalPixelRatio);
       
        // grid and crosshair have line width = Math.floor(pixelRatio)
        // if this value is odd, we have to make candlesticks' width odd 
        // if this value is even, we have to make candlesticks' width even
        // in order of keeping crosshair-over-candlesticks drawing symmetric
   
        if (this._barWidth >= 2) {
            // 根据
            const wickWidth = Math.floor(horizontalPixelRatio);
            if ((wickWidth % 2) !== (this._barWidth % 2)) {
                this._barWidth--;
            }
        }

        const bars = this._data.bars;
        if (this._data.wickVisible) {
            this._drawWicks(renderingScope, bars, this._data.visibleRange);
        }
        if (this._data.borderVisible) {
            this._drawBorder(renderingScope, bars, this._data.visibleRange);
        }
        const borderWidth = this._calculateBorderWidth(horizontalPixelRatio);
        if (!this._data.borderVisible || this._barWidth > borderWidth * 2) {
            this._drawCandles(renderingScope, bars, this._data.visibleRange);
        }
    }
    // 话中线，我感觉只要用画一根线就可以了，不需要画矩形
    _drawWicks(renderingScope, bars, visibleRange) {
        if (this._data === null) {
            return;
        }
        const { context: ctx, horizontalPixelRatio, verticalPixelRatio } = renderingScope;
        let prevWickColor = '';
        // 下面的是源码
        // let wickWidth = Math.min(Math.floor(horizontalPixelRatio), Math.floor(this._data.barSpacing * horizontalPixelRatio));
        // wickWidth = Math.max(Math.floor(horizontalPixelRatio), Math.min(wickWidth, this._barWidth));
        // 其实上面代码可以简化成下面的代码
        let wickWidth = Math.floor(horizontalPixelRatio);
        const wickOffset = Math.floor(wickWidth * 0.5);
        
        let prevEdge = null;
        for (let i = visibleRange.from; i < visibleRange.to; i++) {
            const bar = bars[i];
            if (bar.barWickColor !== prevWickColor) {
                ctx.fillStyle = bar.barWickColor;
                prevWickColor = bar.barWickColor;
            }
            const top = Math.round(Math.min(bar.openY, bar.closeY) * verticalPixelRatio);
            const bottom = Math.round(Math.max(bar.openY, bar.closeY) * verticalPixelRatio);
            const high = Math.round(bar.highY * verticalPixelRatio);
            const low = Math.round(bar.lowY * verticalPixelRatio);
            const scaledX = Math.round(horizontalPixelRatio * bar.x);
            let left = scaledX - wickOffset;
            const right = left + wickWidth - 1;
            if (prevEdge !== null) {
                left = Math.max(prevEdge + 1, left);
                left = Math.min(left, right);
            }
            const width = right - left + 1;
            ctx.fillRect(left, high, width, top - high);
            ctx.fillRect(left, bottom + 1, width, low - bottom);
            prevEdge = right;
        }
    }
    _calculateBorderWidth(pixelRatio) {
        let borderWidth = Math.floor(1 /* Constants.BarBorderWidth */ * pixelRatio);
        if (this._barWidth <= 2 * borderWidth) {
            borderWidth = Math.floor((this._barWidth - 1) * 0.5);
        }
        const res = Math.max(Math.floor(pixelRatio), borderWidth);
        if (this._barWidth <= res * 2) {
            // do not draw bodies, restore original value
            return Math.max(Math.floor(pixelRatio), Math.floor(1 /* Constants.BarBorderWidth */ * pixelRatio));
        }
        return res;
    }
    _drawBorder(renderingScope, bars, visibleRange) {
        if (this._data === null) {
            return;
        }
        const { context: ctx, horizontalPixelRatio, verticalPixelRatio } = renderingScope;
        let prevBorderColor = '';
        const borderWidth = this._calculateBorderWidth(horizontalPixelRatio);
        let prevEdge = null;
        for (let i = visibleRange.from; i < visibleRange.to; i++) {
            const bar = bars[i];
            if (bar.barBorderColor !== prevBorderColor) {
                ctx.fillStyle = bar.barBorderColor;
                prevBorderColor = bar.barBorderColor;
            }
            let left = Math.round(bar.x * horizontalPixelRatio) - Math.floor(this._barWidth * 0.5);
            // this is important to calculate right before patching left
            const right = left + this._barWidth - 1;
            const top = Math.round(Math.min(bar.openY, bar.closeY) * verticalPixelRatio);
            const bottom = Math.round(Math.max(bar.openY, bar.closeY) * verticalPixelRatio);
            if (prevEdge !== null) {
                left = Math.max(prevEdge + 1, left);
                left = Math.min(left, right);
            }
            if (this._data.barSpacing * horizontalPixelRatio > 2 * borderWidth) {
                fillRectInnerBorder(ctx, left, top, right - left + 1, bottom - top + 1, borderWidth);
            }
            else {
                const width = right - left + 1;
                ctx.fillRect(left, top, width, bottom - top + 1);
            }
            prevEdge = right;
        }
    }
    _drawCandles(renderingScope, bars, visibleRange) {
        if (this._data === null) {
            return;
        }
        const { context: ctx, horizontalPixelRatio, verticalPixelRatio } = renderingScope;
        let prevBarColor = '';
        const borderWidth = this._calculateBorderWidth(horizontalPixelRatio);
        for (let i = visibleRange.from; i < visibleRange.to; i++) {
            const bar = bars[i];
            let top = Math.round(Math.min(bar.openY, bar.closeY) * verticalPixelRatio);
            let bottom = Math.round(Math.max(bar.openY, bar.closeY) * verticalPixelRatio);
            let left = Math.round(bar.x * horizontalPixelRatio) - Math.floor(this._barWidth * 0.5);
            let right = left + this._barWidth - 1;
            if (bar.barColor !== prevBarColor) {
                const barColor = bar.barColor;
                ctx.fillStyle = barColor;
                prevBarColor = barColor;
            }
            if (this._data.borderVisible) {
                left += borderWidth;
                top += borderWidth;
                right -= borderWidth;
                bottom -= borderWidth;
            }
            if (top > bottom) {
                continue;
            }
            ctx.fillRect(left, top, right - left + 1, bottom - top + 1);
        }
    }
}


// class SeriesPaneViewBase {
//     _series;
//     _model;
//     _invalidated = true;
//     _dataInvalidated = true;
//     _optionsInvalidated = true;
//     _items = [];
//     _itemsVisibleRange = null;
//     _extendedVisibleRange;
//     constructor(series, model, extendedVisibleRange) {
//         this._series = series;
//         this._model = model;
//         this._extendedVisibleRange = extendedVisibleRange;
//     }
//     update(updateType) {
//         this._invalidated = true;
//         if (updateType === 'data') {
//             this._dataInvalidated = true;
//         }
//         if (updateType === 'options') {
//             this._optionsInvalidated = true;
//         }
//     }
//     renderer() {
//         if (!this._series.visible()) {
//             return null;
//         }
//         this._makeValid();
//         return this._itemsVisibleRange === null ? null : this._renderer;
//     }
//     _updateOptions() {
//         this._items = this._items.map((item) => ({
//             ...item,
//             ...this._series.barColorer().barStyle(item.time),
//         }));
//     }
//     _clearVisibleRange() {
//         this._itemsVisibleRange = null;
//     }
//     _makeValid() {
//         if (this._dataInvalidated) {
//             this._fillRawPoints();
//             this._dataInvalidated = false;
//         }
//         if (this._optionsInvalidated) {
//             this._updateOptions();
//             this._optionsInvalidated = false;
//         }
//         if (this._invalidated) {
//             this._makeValidImpl();
//             this._invalidated = false;
//         }
//     }
//     _makeValidImpl() {
//         const priceScale = this._series.priceScale();
//         const timeScale = this._model.timeScale();
//         this._clearVisibleRange();
//         if (timeScale.isEmpty() || priceScale.isEmpty()) {
//             return;
//         }
//         const visibleBars = timeScale.visibleStrictRange();
//         if (visibleBars === null) {
//             return;
//         }
//         if (this._series.bars().size() === 0) {
//             return;
//         }
//         const firstValue = this._series.firstValue();
//         if (firstValue === null) {
//             return;
//         }
//         this._itemsVisibleRange = visibleTimedValues(this._items, visibleBars, this._extendedVisibleRange);
     
//         this._convertToCoordinates(priceScale, timeScale, firstValue.value);
//         this._prepareRendererData();
//     }
// }

export class SeriesCandlesticksPaneView {
    _renderer = new PaneRendererCandlesticks();
    _series;
    _model;
    _invalidated = true;
    _dataInvalidated = true;
    _optionsInvalidated = true;
    _items = [];
    _itemsVisibleRange = null;
    _extendedVisibleRange = false;
    constructor(series, model) {
        this._series = series;
        this._model = model;
        this._extendedVisibleRange = false;
        console.log(model)
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
