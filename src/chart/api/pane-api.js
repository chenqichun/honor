import { assert } from '../helpers/assertions';
import { PriceScaleApi } from './price-scale-api';
export class PaneApi {
    _chartApi;
    _chartWidget;
    _pane;
    _seriesApiGetter;
    constructor(chartWidget, seriesApiGetter, pane, chartApi) {
        this._chartWidget = chartWidget;
        this._pane = pane;
        this._seriesApiGetter = seriesApiGetter;
        this._chartApi = chartApi;
    }
    getHeight() {
        return this._pane.height();
    }
    setHeight(height) {
        const chartModel = this._chartWidget.model();
        const paneIndex = chartModel.getPaneIndex(this._pane);
        chartModel.changePanesHeight(paneIndex, height);
    }
    getStretchFactor() {
        return this._pane.stretchFactor();
    }
    setStretchFactor(stretchFactor) {
        this._pane.setStretchFactor(stretchFactor);
        this._chartWidget.model().fullUpdate();
    }
    paneIndex() {
        return this._chartWidget.model().getPaneIndex(this._pane);
    }
    moveTo(paneIndex) {
        const currentIndex = this.paneIndex();
        if (currentIndex === paneIndex) {
            return;
        }
        assert(paneIndex >= 0 && paneIndex < this._chartWidget.paneWidgets().length, 'Invalid pane index');
        this._chartWidget.model().movePane(currentIndex, paneIndex);
    }
    getSeries() {
        return this._pane.series().map((source) => this._seriesApiGetter(source)) ?? [];
    }
    getHTMLElement() {
        const widgets = this._chartWidget.paneWidgets();
        if (!widgets || widgets.length === 0 || !widgets[this.paneIndex()]) {
            return null;
        }
        return widgets[this.paneIndex()].getElement();
    }
    attachPrimitive(primitive) {
        this._pane.attachPrimitive(primitive);
        if (primitive.attached) {
            primitive.attached({
                chart: this._chartApi,
                requestUpdate: () => this._pane.model().fullUpdate(),
            });
        }
    }
    detachPrimitive(primitive) {
        this._pane.detachPrimitive(primitive);
    }
    priceScale(priceScaleId) {
        const priceScale = this._pane.priceScaleById(priceScaleId);
        if (priceScale === null) {
            throw new Error(`Cannot find price scale with id: ${priceScaleId}`);
        }
        return new PriceScaleApi(this._chartWidget, priceScaleId, this.paneIndex());
    }
    setPreserveEmptyPane(preserve) {
        this._pane.setPreserveEmptyPane(preserve);
    }
    preserveEmptyPane() {
        return this._pane.preserveEmptyPane();
    }
    addCustomSeries(customPaneView, options = {}, paneIndex = 0) {
        return this._chartApi.addCustomSeries(customPaneView, options, paneIndex);
    }
    addSeries(definition, options = {}) {
        return this._chartApi.addSeries(definition, options, this.paneIndex());
    }
}
