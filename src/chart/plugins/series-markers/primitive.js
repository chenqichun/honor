import { ensureNotNull } from '../../helpers/assertions';
import { seriesMarkerOptionsDefaults } from './options';
import { SeriesMarkersPaneView } from './pane-view';
import { calculateAdjustedMargin, calculateShapeHeight, shapeMargin as calculateShapeMargin, } from './utils';
function mergeOptionsWithDefaults(options) {
    return {
        ...seriesMarkerOptionsDefaults,
        ...options,
    };
}
export class SeriesMarkersPrimitive {
    _paneView = null;
    _markers = [];
    _indexedMarkers = [];
    _dataChangedHandler = null;
    _series = null;
    _chart = null;
    _requestUpdate;
    _autoScaleMarginsInvalidated = true;
    _autoScaleMargins = null;
    _markersPositions = null;
    _cachedBarSpacing = null;
    _recalculationRequired = true;
    _options;
    constructor(options) {
        this._options = mergeOptionsWithDefaults(options);
    }
    attached(param) {
        this._recalculateMarkers();
        this._chart = param.chart;
        this._series = param.series;
        this._paneView = new SeriesMarkersPaneView(this._series, ensureNotNull(this._chart), this._options);
        this._requestUpdate = param.requestUpdate;
        this._series.subscribeDataChanged((scope) => this._onDataChanged(scope));
        this._recalculationRequired = true;
        this.requestUpdate();
    }
    requestUpdate() {
        if (this._requestUpdate) {
            this._requestUpdate();
        }
    }
    detached() {
        if (this._series && this._dataChangedHandler) {
            this._series.unsubscribeDataChanged(this._dataChangedHandler);
        }
        this._chart = null;
        this._series = null;
        this._paneView = null;
        this._dataChangedHandler = null;
    }
    setMarkers(markers) {
        this._recalculationRequired = true;
        this._markers = markers;
        this._recalculateMarkers();
        this._autoScaleMarginsInvalidated = true;
        this._markersPositions = null;
        this.requestUpdate();
    }
    markers() {
        return this._markers;
    }
    paneViews() {
        return this._paneView ? [this._paneView] : [];
    }
    updateAllViews() {
        this._updateAllViews();
    }
    hitTest(x, y) {
        if (this._paneView) {
            return this._paneView.renderer()?.hitTest(x, y) ?? null;
        }
        return null;
    }
    autoscaleInfo(startTimePoint, endTimePoint) {
        if (this._options.autoScale && this._paneView) {
            const margins = this._getAutoScaleMargins();
            if (margins) {
                return {
                    priceRange: null,
                    margins: margins,
                };
            }
        }
        return null;
    }
    applyOptions(options) {
        this._options = mergeOptionsWithDefaults({ ...this._options, ...options });
        if (this.requestUpdate) {
            this.requestUpdate();
        }
    }
    _getAutoScaleMargins() {
        const chart = ensureNotNull(this._chart);
        const barSpacing = chart.timeScale().options().barSpacing;
        if (this._autoScaleMarginsInvalidated || barSpacing !== this._cachedBarSpacing) {
            this._cachedBarSpacing = barSpacing;
            if (this._markers.length > 0) {
                const shapeMargin = calculateShapeMargin(barSpacing);
                const marginValue = calculateShapeHeight(barSpacing) * 1.5 + shapeMargin * 2;
                const positions = this._getMarkerPositions();
                this._autoScaleMargins = {
                    above: calculateAdjustedMargin(marginValue, positions.aboveBar, positions.inBar),
                    below: calculateAdjustedMargin(marginValue, positions.belowBar, positions.inBar),
                };
            }
            else {
                this._autoScaleMargins = null;
            }
            this._autoScaleMarginsInvalidated = false;
        }
        return this._autoScaleMargins;
    }
    _getMarkerPositions() {
        if (this._markersPositions === null) {
            this._markersPositions = this._markers.reduce((acc, marker) => {
                if (!acc[marker.position]) {
                    acc[marker.position] = true;
                }
                return acc;
            }, {
                inBar: false,
                aboveBar: false,
                belowBar: false,
                atPriceTop: false,
                atPriceBottom: false,
                atPriceMiddle: false,
            });
        }
        return this._markersPositions;
    }
    _recalculateMarkers() {
        if (!this._recalculationRequired || !this._chart || !this._series) {
            return;
        }
        const timeScale = this._chart.timeScale();
        const seriesData = this._series?.data();
        if (timeScale.getVisibleLogicalRange() == null || !this._series || seriesData.length === 0) {
            this._indexedMarkers = [];
            return;
        }
        const firstDataIndex = timeScale.timeToIndex(ensureNotNull(seriesData[0].time), true);
        this._indexedMarkers = this._markers.map((marker, index) => {
            const timePointIndex = timeScale.timeToIndex(marker.time, true);
            const searchMode = timePointIndex < firstDataIndex ? 1 /* MismatchDirection.NearestRight */ : -1 /* MismatchDirection.NearestLeft */;
            const seriesDataByIndex = ensureNotNull(this._series).dataByIndex(timePointIndex, searchMode);
            const finalIndex = timeScale.timeToIndex(ensureNotNull(seriesDataByIndex).time, false);
            // You must explicitly define the types so that the minification build processes the field names correctly
            const baseMarker = {
                time: finalIndex,
                position: marker.position,
                shape: marker.shape,
                color: marker.color,
                id: marker.id,
                internalId: index,
                text: marker.text,
                size: marker.size,
                price: marker.price,
                originalTime: marker.time,
            };
            if (marker.position === 'atPriceTop' ||
                marker.position === 'atPriceBottom' ||
                marker.position === 'atPriceMiddle') {
                if (marker.price === undefined) {
                    throw new Error(`Price is required for position ${marker.position}`);
                }
                return {
                    ...baseMarker,
                    position: marker.position, // TypeScript knows this is SeriesMarkerPricePosition
                    price: marker.price,
                };
            }
            else {
                return {
                    ...baseMarker,
                    position: marker.position, // TypeScript knows this is SeriesMarkerBarPosition
                    price: marker.price, // Optional for bar positions
                };
            }
        });
        this._recalculationRequired = false;
    }
    _updateAllViews(updateType) {
        if (this._paneView) {
            this._recalculateMarkers();
            this._paneView.setMarkers(this._indexedMarkers);
            this._paneView.updateOptions(this._options);
            this._paneView.update(updateType);
        }
    }
    _onDataChanged(scope) {
        this._recalculationRequired = true;
        this.requestUpdate();
    }
}
