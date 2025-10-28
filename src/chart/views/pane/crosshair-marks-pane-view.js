import { CompositeRenderer } from '../../renderers/composite-renderer';
import { PaneRendererMarks } from '../../renderers/marks-renderer';
function createEmptyMarkerData() {
    return {
        items: [{
                x: 0,
                y: 0,
                time: 0,
                price: 0,
            }],
        lineColor: '',
        backColor: '',
        radius: 0,
        lineWidth: 0,
        visibleRange: null,
    };
}
const rangeForSinglePoint = { from: 0, to: 1 };
export class CrosshairMarksPaneView {
    _chartModel;
    _crosshair;
    _pane;
    _compositeRenderer = new CompositeRenderer();
    _markersRenderers = [];
    _markersData = [];
    _invalidated = true;
    constructor(chartModel, crosshair, pane) {
        this._chartModel = chartModel;
        this._crosshair = crosshair;
        this._pane = pane;
        this._compositeRenderer.setRenderers(this._markersRenderers);
    }
    update(updateType) {
        this._createMarkerRenderersIfNeeded();
        this._invalidated = true;
    }
    renderer() {
        if (this._invalidated) {
            this._updateImpl();
            this._invalidated = false;
        }
        return this._compositeRenderer;
    }
    _createMarkerRenderersIfNeeded() {
        const serieses = this._pane.orderedSources();
        if (serieses.length !== this._markersRenderers.length) {
            this._markersData = serieses.map(createEmptyMarkerData);
            this._markersRenderers = this._markersData.map((data) => {
                const res = new PaneRendererMarks();
                res.setData(data);
                return res;
            });
            this._compositeRenderer.setRenderers(this._markersRenderers);
        }
    }
    _updateImpl() {
        const forceHidden = this._crosshair.options().mode === 2 /* CrosshairMode.Hidden */ || !this._crosshair.visible();
        const serieses = this._pane.orderedSeries();
        const timePointIndex = this._crosshair.appliedIndex();
        const timeScale = this._chartModel.timeScale();
        this._createMarkerRenderersIfNeeded();
        serieses.forEach((s, index) => {
            const data = this._markersData[index];
            const seriesData = s.markerDataAtIndex(timePointIndex);
            const firstValue = s.firstValue();
            if (forceHidden || seriesData === null || !s.visible() || firstValue === null) {
                data.visibleRange = null;
                return;
            }
            data.lineColor = seriesData.backgroundColor;
            data.radius = seriesData.radius;
            data.lineWidth = seriesData.borderWidth;
            data.items[0].price = seriesData.price;
            data.items[0].y = s.priceScale().priceToCoordinate(seriesData.price, firstValue.value);
            data.backColor = seriesData.borderColor ?? this._chartModel.backgroundColorAtYPercentFromTop(data.items[0].y / s.priceScale().height());
            data.items[0].time = timePointIndex;
            data.items[0].x = timeScale.indexToCoordinate(timePointIndex);
            data.visibleRange = rangeForSinglePoint;
        });
    }
}
