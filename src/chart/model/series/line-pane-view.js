import { LinePaneViewBase } from '../../model/series/line-pane-view-base';
import { PaneRendererLine } from '../../renderers/line-renderer';
export class SeriesLinePaneView extends LinePaneViewBase {
    _renderer = new PaneRendererLine();
    _createRawItem(time, price, colorer) {
        return {
            ...this._createRawItemBase(time, price),
            ...colorer.barStyle(time),
        };
    }
    _prepareRendererData() {
        const options = this._series.options();
        const data = {
            items: this._items,
            lineStyle: options.lineStyle,
            lineType: options.lineVisible ? options.lineType : undefined,
            lineWidth: options.lineWidth,
            pointMarkersRadius: options.pointMarkersVisible ? (options.pointMarkersRadius || options.lineWidth / 2 + 2) : undefined,
            visibleRange: this._itemsVisibleRange,
            barWidth: this._model.timeScale().barSpacing(),
        };
        this._renderer.setData(data);
    }
}
