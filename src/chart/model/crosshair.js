import { ensureNotNull } from '../helpers/assertions';
import { notNull } from '../helpers/strict-type-checks';
import { CrosshairMarksPaneView } from '../views/pane/crosshair-marks-pane-view';
import { CrosshairPaneView } from '../views/pane/crosshair-pane-view';
import { CrosshairPriceAxisView } from '../views/price-axis/crosshair-price-axis-view';
import { CrosshairTimeAxisView } from '../views/time-axis/crosshair-time-axis-view';
import { DataSource } from './data-source';
export class Crosshair extends DataSource {
    _pane = null;
    _price = NaN;
    _index = 0;
    _visible = false; // initially the crosshair should not be visible, until the user interacts.
    _model;
    _priceAxisViews = new Map();
    _timeAxisView;
    _subscribed = false;
    _currentPosPriceProvider;
    _options;
    _crosshairPaneViewCache = new WeakMap();
    _markersPaneViewCache = new WeakMap();
    _x = NaN;
    _y = NaN;
    _originX = NaN;
    _originY = NaN;
    constructor(model, options) {
        super();
        this._model = model;
        this._options = options;
        const valuePriceProvider = (rawPriceProvider, rawCoordinateProvider) => {
            return (priceScale) => {
                const coordinate = rawCoordinateProvider();
                const rawPrice = rawPriceProvider();
                if (priceScale === ensureNotNull(this._pane).defaultPriceScale()) {
                    // price must be defined
                    return { price: rawPrice, coordinate: coordinate };
                }
                else {
                    // always convert from coordinate
                    const firstValue = ensureNotNull(priceScale.firstValue());
                    const price = priceScale.coordinateToPrice(coordinate, firstValue);
                    return { price: price, coordinate: coordinate };
                }
            };
        };
        const valueTimeProvider = (rawIndexProvider, rawCoordinateProvider) => {
            return () => {
                const time = this._model.timeScale().indexToTime(rawIndexProvider());
                const coordinate = rawCoordinateProvider();
                if (!time || !Number.isFinite(coordinate)) {
                    return null;
                }
                return {
                    time,
                    coordinate,
                };
            };
        };
        // for current position always return both price and coordinate
        this._currentPosPriceProvider = valuePriceProvider(() => this._price, () => this._y);
        const currentPosTimeProvider = valueTimeProvider(() => this._index, () => this.appliedX());
        this._timeAxisView = new CrosshairTimeAxisView(this, model, currentPosTimeProvider);
    }
    options() {
        return this._options;
    }
    saveOriginCoord(x, y) {
        this._originX = x;
        this._originY = y;
    }
    clearOriginCoord() {
        this._originX = NaN;
        this._originY = NaN;
    }
    originCoordX() {
        return this._originX;
    }
    originCoordY() {
        return this._originY;
    }
    setPosition(index, price, pane) {
        if (!this._subscribed) {
            this._subscribed = true;
        }
        this._visible = true;
        this._tryToUpdateViews(index, price, pane);
    }
    appliedIndex() {
        return this._index;
    }
    appliedX() {
        return this._x;
    }
    appliedY() {
        return this._y;
    }
    visible() {
        return this._visible;
    }
    clearPosition() {
        this._visible = false;
        this._setIndexToLastSeriesBarIndex();
        this._price = NaN;
        this._x = NaN;
        this._y = NaN;
        this._pane = null;
        this.clearOriginCoord();
        this.updateAllViews();
    }
    paneViews(pane) {
        let crosshairPaneView = this._crosshairPaneViewCache.get(pane);
        if (!crosshairPaneView) {
            crosshairPaneView = new CrosshairPaneView(this, pane);
            this._crosshairPaneViewCache.set(pane, crosshairPaneView);
        }
        let markersPaneView = this._markersPaneViewCache.get(pane);
        if (!markersPaneView) {
            markersPaneView = new CrosshairMarksPaneView(this._model, this, pane);
            this._markersPaneViewCache.set(pane, markersPaneView);
        }
        return [crosshairPaneView, markersPaneView];
    }
    horzLineVisible(pane) {
        return pane === this._pane && this._options.horzLine.visible;
    }
    vertLineVisible() {
        return this._options.vertLine.visible;
    }
    priceAxisViews(pane, priceScale) {
        if (!this._visible || this._pane !== pane) {
            this._priceAxisViews.clear();
        }
        const views = [];
        if (this._pane === pane) {
            views.push(this._createPriceAxisViewOnDemand(this._priceAxisViews, priceScale, this._currentPosPriceProvider));
        }
        return views;
    }
    timeAxisViews() {
        return this._visible ? [this._timeAxisView] : [];
    }
    pane() {
        return this._pane;
    }
    updateAllViews() {
        this._model.panes().forEach((pane) => {
            this._crosshairPaneViewCache.get(pane)?.update();
            this._markersPaneViewCache.get(pane)?.update();
        });
        this._priceAxisViews.forEach((value) => value.update());
        this._timeAxisView.update();
    }
    _priceScaleByPane(pane) {
        if (pane && !pane.defaultPriceScale().isEmpty()) {
            return pane.defaultPriceScale();
        }
        return null;
    }
    _tryToUpdateViews(index, price, pane) {
        if (this._tryToUpdateData(index, price, pane)) {
            this.updateAllViews();
        }
    }
    _tryToUpdateData(newIndex, newPrice, newPane) {
        const oldX = this._x;
        const oldY = this._y;
        const oldPrice = this._price;
        const oldIndex = this._index;
        const oldPane = this._pane;
        const priceScale = this._priceScaleByPane(newPane);
        this._index = newIndex;
        this._x = isNaN(newIndex) ? NaN : this._model.timeScale().indexToCoordinate(newIndex);
        this._pane = newPane;
        const firstValue = priceScale !== null ? priceScale.firstValue() : null;
        if (priceScale !== null && firstValue !== null) {
            this._price = newPrice;
            this._y = priceScale.priceToCoordinate(newPrice, firstValue);
        }
        else {
            this._price = NaN;
            this._y = NaN;
        }
        return (oldX !== this._x || oldY !== this._y || oldIndex !== this._index ||
            oldPrice !== this._price || oldPane !== this._pane);
    }
    _setIndexToLastSeriesBarIndex() {
        const lastIndexes = this._model.serieses()
            .map((s) => s.bars().lastIndex())
            .filter(notNull);
        const lastBarIndex = (lastIndexes.length === 0) ? null : Math.max(...lastIndexes);
        this._index = lastBarIndex !== null ? lastBarIndex : NaN;
    }
    _createPriceAxisViewOnDemand(map, priceScale, valueProvider) {
        let view = map.get(priceScale);
        if (view === undefined) {
            view = new CrosshairPriceAxisView(this, priceScale, valueProvider);
            map.set(priceScale, view);
        }
        return view;
    }
}
