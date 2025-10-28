import { ensureDefined } from '../../helpers/assertions';
import { isFulfilledData, isWhitespaceData } from '../../model/data-consumer';
import { ExpiringMarkerManager } from './expiring-markers-manager';
import { upDownMarkersPluginOptionDefaults, } from './options';
import { MarkersPrimitivePaneView } from './view';
function isLineData(item, type) {
    return type === 'Line' || type === 'Area';
}
export class UpDownMarkersPrimitive {
    _chart = undefined;
    _series = undefined;
    _paneViews = [];
    _markersManager;
    _requestUpdate;
    _horzScaleBehavior = null;
    _options;
    _managedDataPoints = new Map();
    constructor(options) {
        this._markersManager = new ExpiringMarkerManager(() => this.requestUpdate());
        this._options = {
            ...upDownMarkersPluginOptionDefaults,
            ...options,
        };
    }
    applyOptions(options) {
        this._options = {
            ...this._options,
            ...options,
        };
        this.requestUpdate();
    }
    setMarkers(markers) {
        this._markersManager.clearAllMarkers();
        const horzBehaviour = this._horzScaleBehavior;
        if (!horzBehaviour) {
            return;
        }
        markers.forEach((marker) => {
            this._markersManager.setMarker(marker, horzBehaviour.key(marker.time));
        });
    }
    markers() {
        return this._markersManager.getMarkers();
    }
    requestUpdate() {
        this._requestUpdate?.();
    }
    attached(params) {
        const { chart, series, requestUpdate, horzScaleBehavior, } = params;
        this._chart = chart;
        this._series = series;
        this._horzScaleBehavior = horzScaleBehavior;
        const seriesType = this._series.seriesType();
        if (seriesType !== 'Area' && seriesType !== 'Line') {
            throw new Error('UpDownMarkersPrimitive is only supported for Area and Line series types');
        }
        this._paneViews = [
            new MarkersPrimitivePaneView(this._series, this._chart.timeScale(), this._options),
        ];
        this._requestUpdate = requestUpdate;
        this.requestUpdate();
    }
    detached() {
        this._chart = undefined;
        this._series = undefined;
        this._requestUpdate = undefined;
    }
    chart() {
        return ensureDefined(this._chart);
    }
    series() {
        return ensureDefined(this._series);
    }
    updateAllViews() {
        this._paneViews.forEach((pw) => pw.update(this.markers()));
    }
    paneViews() {
        return this._paneViews;
    }
    setData(data) {
        if (!this._series) {
            throw new Error('Primitive not attached to series');
        }
        const seriesType = this._series.seriesType();
        this._managedDataPoints.clear();
        const horzBehaviour = this._horzScaleBehavior;
        if (horzBehaviour) {
            data.forEach((d) => {
                if (isFulfilledData(d) && isLineData(d, seriesType)) {
                    this._managedDataPoints.set(horzBehaviour.key(d.time), d.value);
                }
            });
        }
        ensureDefined(this._series).setData(data);
    }
    update(data, historicalUpdate) {
        if (!this._series || !this._horzScaleBehavior) {
            throw new Error('Primitive not attached to series');
        }
        const seriesType = this._series.seriesType();
        const horzKey = this._horzScaleBehavior.key(data.time);
        if (isWhitespaceData(data)) {
            this._managedDataPoints.delete(horzKey);
        }
        if (isFulfilledData(data) && isLineData(data, seriesType)) {
            const existingPrice = this._managedDataPoints.get(horzKey);
            if (existingPrice) {
                this._markersManager.setMarker({
                    time: data.time,
                    value: data.value,
                    sign: getSign(data.value, existingPrice),
                }, horzKey, this._options.updateVisibilityDuration);
            }
        }
        ensureDefined(this._series).update(data, historicalUpdate);
    }
    clearMarkers() {
        this._markersManager.clearAllMarkers();
    }
}
function getSign(newValue, oldValue) {
    if (newValue === oldValue) {
        return 0;
    }
    return newValue - oldValue > 0 ? 1 : -1;
}
