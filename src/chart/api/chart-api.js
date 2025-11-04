/// <reference types="_build-time-constants" />
import { ChartWidget } from '../gui/chart-widget';
import { assert, ensure, ensureDefined } from '../helpers/assertions';
import { Delegate } from '../helpers/delegate';
import { warn } from '../helpers/logger';
import { clone, isBoolean, merge } from '../helpers/strict-type-checks';
import { isFulfilledData } from '../model/data-consumer';
import { DataLayer } from '../model/data-layer';
import { Series } from '../model/series';
import { fillUpDownCandlesticksColors, precisionByMinMove, } from '../model/series-options';
import { createCustomSeriesDefinition } from '../model/series/custom-series';
import { isSeriesDefinition } from '../model/series/series-def';
import { getSeriesDataCreator } from './get-series-data-creator';
import { chartOptionsDefaults } from './options/chart-options-defaults';
import { seriesOptionsDefaults } from './options/series-options-defaults';
import { PaneApi } from './pane-api';
import { PriceScaleApi } from './price-scale-api';
import { SeriesApi } from './series-api';
import { TimeScaleApi } from './time-scale-api';
function patchPriceFormat(priceFormat) {
    if (priceFormat === undefined || priceFormat.type === 'custom') {
        return;
    }
    const priceFormatBuiltIn = priceFormat;
    if (priceFormatBuiltIn.minMove !== undefined && priceFormatBuiltIn.precision === undefined) {
        priceFormatBuiltIn.precision = precisionByMinMove(priceFormatBuiltIn.minMove);
    }
}
function migrateHandleScaleScrollOptions(options) {
    if (isBoolean(options['handleScale'])) {
        const handleScale = options['handleScale'];
        options['handleScale'] = {
            axisDoubleClickReset: {
                time: handleScale,
                price: handleScale,
            },
            axisPressedMouseMove: {
                time: handleScale,
                price: handleScale,
            },
            mouseWheel: handleScale,
            pinch: handleScale,
        };
    }
    else if (options['handleScale'] !== undefined) {
        const { axisPressedMouseMove, axisDoubleClickReset } = options['handleScale'];
        if (isBoolean(axisPressedMouseMove)) {
            options['handleScale'].axisPressedMouseMove = {
                time: axisPressedMouseMove,
                price: axisPressedMouseMove,
            };
        }
        if (isBoolean(axisDoubleClickReset)) {
            options['handleScale'].axisDoubleClickReset = {
                time: axisDoubleClickReset,
                price: axisDoubleClickReset,
            };
        }
    }
    const handleScroll = options['handleScroll'];
    if (isBoolean(handleScroll)) {
        options['handleScroll'] = {
            horzTouchDrag: handleScroll,
            vertTouchDrag: handleScroll,
            mouseWheel: handleScroll,
            pressedMouseMove: handleScroll,
        };
    }
}
function toInternalOptions(options) {
    migrateHandleScaleScrollOptions(options);
    return options;
}
export class ChartApi {
    _horzScaleBehavior;
    _chartWidget;
    _dataLayer;
    _seriesMap = new Map();
    _seriesMapReversed = new Map();
    _clickedDelegate = new Delegate();
    _dblClickedDelegate = new Delegate();
    _crosshairMovedDelegate = new Delegate();
    _timeScaleApi;
    _panes = new WeakMap();
    constructor(container, horzScaleBehavior, options) {
        this._dataLayer = new DataLayer(horzScaleBehavior);
        const internalOptions = (options === undefined) ?
            clone(chartOptionsDefaults()) :
            merge(clone(chartOptionsDefaults()), toInternalOptions(options));
        this._horzScaleBehavior = horzScaleBehavior;

        this._chartWidget = new ChartWidget(container, internalOptions, horzScaleBehavior);
        this._chartWidget.clicked().subscribe((paramSupplier) => {
            if (this._clickedDelegate.hasListeners()) {
                this._clickedDelegate.fire(this._convertMouseParams(paramSupplier()));
            }
        }, this);
        this._chartWidget.dblClicked().subscribe((paramSupplier) => {
            if (this._dblClickedDelegate.hasListeners()) {
                this._dblClickedDelegate.fire(this._convertMouseParams(paramSupplier()));
            }
        }, this);
        this._chartWidget.crosshairMoved().subscribe((paramSupplier) => {
            if (this._crosshairMovedDelegate.hasListeners()) {
                this._crosshairMovedDelegate.fire(this._convertMouseParams(paramSupplier()));
            }
        }, this);
        const model = this._chartWidget.model();
        this._timeScaleApi = new TimeScaleApi(model, this._chartWidget.timeAxisWidget(), this._horzScaleBehavior);
    }
    remove() {
        this._chartWidget.clicked().unsubscribeAll(this);
        this._chartWidget.dblClicked().unsubscribeAll(this);
        this._chartWidget.crosshairMoved().unsubscribeAll(this);
        this._timeScaleApi.destroy();
        this._chartWidget.destroy();
        this._seriesMap.clear();
        this._seriesMapReversed.clear();
        this._clickedDelegate.destroy();
        this._dblClickedDelegate.destroy();
        this._crosshairMovedDelegate.destroy();
        this._dataLayer.destroy();
    }
    resize(width, height, forceRepaint) {
        if (this.autoSizeActive()) {
            // We return early here instead of checking this within the actual _chartWidget.resize method
            // because this should only apply to external resize requests.
            warn(`Height and width values ignored because 'autoSize' option is enabled.`);
            return;
        }
        this._chartWidget.resize(width, height, forceRepaint);
    }
    addCustomSeries(customPaneView, options = {}, paneIndex = 0) {
        const paneView = ensure(customPaneView);
        const definition = createCustomSeriesDefinition(paneView);
        return this._addSeriesImpl(definition, options, paneIndex);
    }
    addSeries(definition, options = {}, paneIndex = 0) {
        return this._addSeriesImpl(definition, options, paneIndex);
    }
    removeSeries(seriesApi) {
        const series = ensureDefined(this._seriesMap.get(seriesApi));
        const update = this._dataLayer.removeSeries(series);
        const model = this._chartWidget.model();
        model.removeSeries(series);
        this._sendUpdateToChart(update);
        this._seriesMap.delete(seriesApi);
        this._seriesMapReversed.delete(series);
    }
    applyNewData(series, data) {
        this._sendUpdateToChart(this._dataLayer.setSeriesData(series, data));
    }
    updateData(series, data, historicalUpdate) {
        this._sendUpdateToChart(this._dataLayer.updateSeriesData(series, data, historicalUpdate));
    }
    popData(series, count) {
        const [poppedData, update] = this._dataLayer.popSeriesData(series, count);
        if (poppedData.length !== 0) {
            this._sendUpdateToChart(update);
        }
        return poppedData;
    }
    subscribeClick(handler) {
        this._clickedDelegate.subscribe(handler);
    }
    unsubscribeClick(handler) {
        this._clickedDelegate.unsubscribe(handler);
    }
    subscribeCrosshairMove(handler) {
        this._crosshairMovedDelegate.subscribe(handler);
    }
    unsubscribeCrosshairMove(handler) {
        this._crosshairMovedDelegate.unsubscribe(handler);
    }
    subscribeDblClick(handler) {
        this._dblClickedDelegate.subscribe(handler);
    }
    unsubscribeDblClick(handler) {
        this._dblClickedDelegate.unsubscribe(handler);
    }
    priceScale(priceScaleId, paneIndex = 0) {
        return new PriceScaleApi(this._chartWidget, priceScaleId, paneIndex);
    }
    timeScale() {
        return this._timeScaleApi;
    }
    applyOptions(options) {
        if (process.env.NODE_ENV === 'development') {
            const colorSpace = options.layout?.colorSpace;
            if (colorSpace !== undefined && colorSpace !== this.options().layout.colorSpace) {
                throw new Error(`colorSpace option should not be changed once the chart has been created.`);
            }
            const colorParsers = options.layout?.colorParsers;
            if (colorParsers !== undefined && colorParsers !== this.options().layout.colorParsers) {
                throw new Error(`colorParsers option should not be changed once the chart has been created.`);
            }
        }
        this._chartWidget.applyOptions(toInternalOptions(options));
    }
    options() {
        return this._chartWidget.options();
    }
    takeScreenshot(addTopLayer = false, includeCrosshair = false) {
        let crosshairMode;
        let screenshotCanvas;
        try {
            if (!includeCrosshair) {
                crosshairMode = this._chartWidget.model().options().crosshair.mode;
                this._chartWidget.applyOptions({
                    crosshair: {
                        mode: 2 /* CrosshairMode.Hidden */,
                    },
                });
            }
            screenshotCanvas = this._chartWidget.takeScreenshot(addTopLayer);
        }
        finally {
            if (!includeCrosshair && crosshairMode !== undefined) {
                this._chartWidget.model().applyOptions({
                    crosshair: {
                        mode: crosshairMode,
                    },
                });
            }
        }
        return screenshotCanvas;
    }
    addPane(preserveEmptyPane = false) {
        const pane = this._chartWidget.model().addPane();
        pane.setPreserveEmptyPane(preserveEmptyPane);
        return this._getPaneApi(pane);
    }
    removePane(index) {
        this._chartWidget.model().removePane(index);
    }
    swapPanes(first, second) {
        this._chartWidget.model().swapPanes(first, second);
    }
    autoSizeActive() {
        return this._chartWidget.autoSizeActive();
    }
    chartElement() {
        return this._chartWidget.element();
    }
    panes() {
        return this._chartWidget.model().panes().map((pane) => this._getPaneApi(pane));
    }
    paneSize(paneIndex = 0) {
        const size = this._chartWidget.paneSize(paneIndex);
        return {
            height: size.height,
            width: size.width,
        };
    }
    setCrosshairPosition(price, horizontalPosition, seriesApi) {
        const series = this._seriesMap.get(seriesApi);
        if (series === undefined) {
            return;
        }
        const pane = this._chartWidget.model().paneForSource(series);
        if (pane === null) {
            return;
        }
        this._chartWidget.model().setAndSaveSyntheticPosition(price, horizontalPosition, pane);
    }
    clearCrosshairPosition() {
        this._chartWidget.model().clearCurrentPosition(true);
    }
    horzBehaviour() {
        return this._horzScaleBehavior;
    }
    _addSeriesImpl(definition, options = {}, paneIndex = 0) {
        // 格式对不对
        assert(isSeriesDefinition(definition));
        // 格式化精度
        patchPriceFormat(options.priceFormat);
        if (definition.type === 'Candlestick') {
            // 对柱状图的边框颜色进行处理
            fillUpDownCandlesticksColors(options);
        }
        // 合并参数
        const strictOptions = merge(clone(seriesOptionsDefaults), clone(definition.defaultOptions), options);
        
        const createPaneView = definition.createPaneView;
        const series = new Series(this._chartWidget.model(), definition.type, strictOptions, createPaneView, definition.customPaneView);

        this._chartWidget.model().addSeriesToPane(series, paneIndex);
        const res = new SeriesApi(series, this, this, this, this._horzScaleBehavior, (pane) => this._getPaneApi(pane));
        this._seriesMap.set(res, series);
        this._seriesMapReversed.set(series, res);
        return res;
    }
    _sendUpdateToChart(update) {
        const model = this._chartWidget.model();
        model.updateTimeScale(update.timeScale.baseIndex, update.timeScale.points, update.timeScale.firstChangedPointIndex);
        update.series.forEach((value, series) => series.setData(value.data, value.info));
        model.timeScale().recalculateIndicesWithData();
        model.recalculateAllPanes();
    }
    _mapSeriesToApi(series) {
        return ensureDefined(this._seriesMapReversed.get(series));
    }
    _convertMouseParams(param) {
        const seriesData = new Map();
        param.seriesData.forEach((plotRow, series) => {
            const seriesType = series.seriesType();
            const data = getSeriesDataCreator(seriesType)(plotRow);
            if (seriesType !== 'Custom') {
                assert(isFulfilledData(data));
            }
            else {
                const customWhitespaceChecker = series.customSeriesWhitespaceCheck();
                assert(!customWhitespaceChecker || customWhitespaceChecker(data) === false);
            }
            seriesData.set(this._mapSeriesToApi(series), data);
        });
        const hoveredSeries = param.hoveredSeries === undefined ||
            !this._seriesMapReversed.has(param.hoveredSeries)
            ? undefined
            : this._mapSeriesToApi(param.hoveredSeries);
        return {
            time: param.originalTime,
            logical: param.index,
            point: param.point,
            paneIndex: param.paneIndex,
            hoveredSeries,
            hoveredObjectId: param.hoveredObject,
            seriesData,
            sourceEvent: param.touchMouseEventData,
        };
    }
    _getPaneApi(pane) {
        let result = this._panes.get(pane);
        if (!result) {
            result = new PaneApi(this._chartWidget, (series) => this._mapSeriesToApi(series), pane, this);
            this._panes.set(pane, result);
        }
        return result;
    }
}
