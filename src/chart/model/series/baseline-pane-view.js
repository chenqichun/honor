import { PaneRendererBaselineArea } from '../../renderers/baseline-renderer-area';
import { PaneRendererBaselineLine } from '../../renderers/baseline-renderer-line';
import { CompositeRenderer } from '../../renderers/composite-renderer';
import { LinePaneViewBase } from './line-pane-view-base';
export class SeriesBaselinePaneView extends LinePaneViewBase {
    _renderer = new CompositeRenderer();
    _baselineAreaRenderer = new PaneRendererBaselineArea();
    _baselineLineRenderer = new PaneRendererBaselineLine();
    constructor(series, model) {
        super(series, model);
        this._renderer.setRenderers([this._baselineAreaRenderer, this._baselineLineRenderer]);
    }
    _createRawItem(time, price, colorer) {
        return {
            ...this._createRawItemBase(time, price),
            ...colorer.barStyle(time),
        };
    }
    _prepareRendererData() {
        const firstValue = this._series.firstValue();
        if (firstValue === null) {
            return;
        }
        const options = this._series.options();
        const baseLevelCoordinate = this._series.priceScale().priceToCoordinate(options.baseValue.price, firstValue.value);
        const barWidth = this._model.timeScale().barSpacing();
        if (this._itemsVisibleRange === null || this._items.length === 0) {
            return;
        }
        let topCoordinate;
        let bottomCoordinate;
        if (options.relativeGradient) {
            topCoordinate = this._items[this._itemsVisibleRange.from].y;
            bottomCoordinate = this._items[this._itemsVisibleRange.from].y;
            for (let i = this._itemsVisibleRange.from; i < this._itemsVisibleRange.to; i++) {
                const item = this._items[i];
                if (item.y < topCoordinate) {
                    topCoordinate = item.y;
                }
                if (item.y > bottomCoordinate) {
                    bottomCoordinate = item.y;
                }
            }
        }
        this._baselineAreaRenderer.setData({
            items: this._items,
            lineWidth: options.lineWidth,
            lineStyle: options.lineStyle,
            lineType: options.lineType,
            baseLevelCoordinate,
            topCoordinate,
            bottomCoordinate,
            invertFilledArea: false,
            visibleRange: this._itemsVisibleRange,
            barWidth,
        });
        this._baselineLineRenderer.setData({
            items: this._items,
            lineWidth: options.lineWidth,
            lineStyle: options.lineStyle,
            lineType: options.lineVisible ? options.lineType : undefined,
            pointMarkersRadius: options.pointMarkersVisible ? (options.pointMarkersRadius || options.lineWidth / 2 + 2) : undefined,
            baseLevelCoordinate,
            topCoordinate,
            bottomCoordinate,
            visibleRange: this._itemsVisibleRange,
            barWidth,
        });
    }
}
