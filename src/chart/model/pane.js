import { assert, ensureDefined, ensureNotNull } from '../helpers/assertions';
import { Delegate } from '../helpers/delegate';
import { clamp } from '../helpers/mathex';
import { clone } from '../helpers/strict-type-checks';
import { isDefaultPriceScale } from './default-price-scale';
import { Grid } from './grid';
import { PanePrimitiveWrapper } from './pane-primitive-wrapper';
import { PriceScale } from './price-scale';
import { Series } from './series';
import { sortSources } from './sort-sources';
function isSeries(source) {
    return source instanceof Series;
}
export const DEFAULT_STRETCH_FACTOR = 1;
export const MIN_PANE_HEIGHT = 30;
export class Pane {
    _timeScale;
    _model;
    _grid;
    _dataSources = [];
    _overlaySourcesByScaleId = new Map();
    _height = 0;
    _width = 0;
    _stretchFactor = DEFAULT_STRETCH_FACTOR;
    _cachedOrderedSources = null;
    _preserveEmptyPane = false;
    _destroyed = new Delegate();
    _leftPriceScale;
    _rightPriceScale;
    _primitives = [];
    constructor(timeScale, model) {
        this._timeScale = timeScale;
        this._model = model;
        this._grid = new Grid(this);
        const options = model.options();
        this._leftPriceScale = this._createPriceScale("left" /* DefaultPriceScaleId.Left */, options.leftPriceScale);
        this._rightPriceScale = this._createPriceScale("right" /* DefaultPriceScaleId.Right */, options.rightPriceScale);
        this._leftPriceScale.modeChanged().subscribe(this._onPriceScaleModeChanged.bind(this, this._leftPriceScale), this);
        this._rightPriceScale.modeChanged().subscribe(this._onPriceScaleModeChanged.bind(this, this._rightPriceScale), this);
        this.applyScaleOptions(options);
    }
    applyScaleOptions(options) {
        if (options.leftPriceScale) {
            this._leftPriceScale.applyOptions(options.leftPriceScale);
        }
        if (options.rightPriceScale) {
            this._rightPriceScale.applyOptions(options.rightPriceScale);
        }
        if (options.localization) {
            this._leftPriceScale.updateFormatter();
            this._rightPriceScale.updateFormatter();
        }
        if (options.overlayPriceScales) {
            const sourceArrays = Array.from(this._overlaySourcesByScaleId.values());
            for (const arr of sourceArrays) {
                const priceScale = ensureNotNull(arr[0].priceScale());
                priceScale.applyOptions(options.overlayPriceScales);
                if (options.localization) {
                    priceScale.updateFormatter();
                }
            }
        }
    }
    priceScaleById(id) {
        switch (id) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
            case "left" /* DefaultPriceScaleId.Left */: {
                return this._leftPriceScale;
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
            case "right" /* DefaultPriceScaleId.Right */: {
                return this._rightPriceScale;
            }
        }
        if (this._overlaySourcesByScaleId.has(id)) {
            return ensureDefined(this._overlaySourcesByScaleId.get(id))[0].priceScale();
        }
        return null;
    }
    destroy() {
        this.model().priceScalesOptionsChanged().unsubscribeAll(this);
        this._leftPriceScale.modeChanged().unsubscribeAll(this);
        this._rightPriceScale.modeChanged().unsubscribeAll(this);
        this._dataSources.forEach((source) => {
            if (source.destroy) {
                source.destroy();
            }
        });
        this._primitives = this._primitives.filter((primitive) => {
            const p = primitive.primitive();
            if (p.detached) {
                p.detached();
            }
            return false;
        });
        this._destroyed.fire();
    }
    stretchFactor() {
        return this._stretchFactor;
    }
    setStretchFactor(factor) {
        this._stretchFactor = factor;
    }
    model() {
        return this._model;
    }
    width() {
        return this._width;
    }
    height() {
        return this._height;
    }
    setWidth(width) {
        this._width = width;
        this.updateAllSources();
    }
    setHeight(height) {
        this._height = height;
        this._leftPriceScale.setHeight(height);
        this._rightPriceScale.setHeight(height);
        // process overlays
        this._dataSources.forEach((ds) => {
            if (this.isOverlay(ds)) {
                const priceScale = ds.priceScale();
                if (priceScale !== null) {
                    priceScale.setHeight(height);
                }
            }
        });
        this.updateAllSources();
    }
    setPreserveEmptyPane(preserve) {
        this._preserveEmptyPane = preserve;
    }
    preserveEmptyPane() {
        return this._preserveEmptyPane;
    }
    series() {
        return this._dataSources.filter(isSeries);
    }
    dataSources() {
        return this._dataSources;
    }
    isOverlay(source) {
        const priceScale = source.priceScale();
        if (priceScale === null) {
            return true;
        }
        return this._leftPriceScale !== priceScale && this._rightPriceScale !== priceScale;
    }
    addDataSource(source, targetScaleId, keepSourcesOrder) {
        this._insertDataSource(source, targetScaleId, keepSourcesOrder ? source.zorder() : this._dataSources.length);
    }
    removeDataSource(source, keepSourceOrder) {
        const index = this._dataSources.indexOf(source);
        assert(index !== -1, 'removeDataSource: invalid data source');
        this._dataSources.splice(index, 1);
        if (!keepSourceOrder) {
            this._dataSources.forEach((ds, i) => ds.setZorder(i));
        }
        const priceScaleId = ensureNotNull(source.priceScale()).id();
        if (this._overlaySourcesByScaleId.has(priceScaleId)) {
            const overlaySources = ensureDefined(this._overlaySourcesByScaleId.get(priceScaleId));
            const overlayIndex = overlaySources.indexOf(source);
            if (overlayIndex !== -1) {
                overlaySources.splice(overlayIndex, 1);
                if (overlaySources.length === 0) {
                    this._overlaySourcesByScaleId.delete(priceScaleId);
                }
            }
        }
        const priceScale = source.priceScale();
        // if source has owner, it returns owner's price scale
        // and it does not have source in their list
        if (priceScale && priceScale.dataSources().indexOf(source) >= 0) {
            priceScale.removeDataSource(source);
            this.recalculatePriceScale(priceScale);
        }
        this._cachedOrderedSources = null;
    }
    priceScalePosition(priceScale) {
        if (priceScale === this._leftPriceScale) {
            return 'left';
        }
        if (priceScale === this._rightPriceScale) {
            return 'right';
        }
        return 'overlay';
    }
    leftPriceScale() {
        return this._leftPriceScale;
    }
    rightPriceScale() {
        return this._rightPriceScale;
    }
    startScalePrice(priceScale, x) {
        priceScale.startScale(x);
    }
    scalePriceTo(priceScale, x) {
        priceScale.scaleTo(x);
        // TODO: be more smart and update only affected views
        this.updateAllSources();
    }
    endScalePrice(priceScale) {
        priceScale.endScale();
    }
    startScrollPrice(priceScale, x) {
        priceScale.startScroll(x);
    }
    scrollPriceTo(priceScale, x) {
        priceScale.scrollTo(x);
        this.updateAllSources();
    }
    endScrollPrice(priceScale) {
        priceScale.endScroll();
    }
    updateAllSources() {
        this._dataSources.forEach((source) => {
            source.updateAllViews();
        });
    }
    defaultPriceScale() {
        let priceScale = null;
        if (this._model.options().rightPriceScale.visible && this._rightPriceScale.dataSources().length !== 0) {
            priceScale = this._rightPriceScale;
        }
        else if (this._model.options().leftPriceScale.visible && this._leftPriceScale.dataSources().length !== 0) {
            priceScale = this._leftPriceScale;
        }
        else if (this._dataSources.length !== 0) {
            priceScale = this._dataSources[0].priceScale();
        }
        if (priceScale === null) {
            priceScale = this._rightPriceScale;
        }
        return priceScale;
    }
    defaultVisiblePriceScale() {
        let priceScale = null;
        if (this._model.options().rightPriceScale.visible) {
            priceScale = this._rightPriceScale;
        }
        else if (this._model.options().leftPriceScale.visible) {
            priceScale = this._leftPriceScale;
        }
        return priceScale;
    }
    recalculatePriceScale(priceScale) {
        if (priceScale === null || !priceScale.isAutoScale()) {
            return;
        }
        this._recalculatePriceScaleImpl(priceScale);
    }
    resetPriceScale(priceScale) {
        const visibleBars = this._timeScale.visibleStrictRange();
        priceScale.setMode({ autoScale: true });
        if (visibleBars !== null) {
            priceScale.recalculatePriceRange(visibleBars);
        }
        this.updateAllSources();
    }
    momentaryAutoScale() {
        this._recalculatePriceScaleImpl(this._leftPriceScale);
        this._recalculatePriceScaleImpl(this._rightPriceScale);
    }
    recalculate() {
        this.recalculatePriceScale(this._leftPriceScale);
        this.recalculatePriceScale(this._rightPriceScale);
        this._dataSources.forEach((ds) => {
            if (this.isOverlay(ds)) {
                this.recalculatePriceScale(ds.priceScale());
            }
        });
        this.updateAllSources();
        this._model.lightUpdate();
    }
    orderedSources() {
        if (this._cachedOrderedSources === null) {
            this._cachedOrderedSources = sortSources(this._dataSources);
        }
        return this._cachedOrderedSources;
    }
    setSeriesOrder(series, order) {
        order = clamp(order, 0, this._dataSources.length - 1);
        const index = this._dataSources.indexOf(series);
        assert(index !== -1, 'setSeriesOrder: invalid data source');
        this._dataSources.splice(index, 1);
        this._dataSources.splice(order, 0, series);
        this._dataSources.forEach((ps, i) => ps.setZorder(i));
        this._cachedOrderedSources = null;
        for (const ps of [this._leftPriceScale, this._rightPriceScale]) {
            ps.invalidateSourcesCache();
            ps.updateFormatter();
        }
        this._model.lightUpdate();
    }
    orderedSeries() {
        return this.orderedSources().filter(isSeries);
    }
    onDestroyed() {
        return this._destroyed;
    }
    grid() {
        return this._grid;
    }
    attachPrimitive(primitive) {
        this._primitives.push(new PanePrimitiveWrapper(primitive));
    }
    detachPrimitive(source) {
        this._primitives = this._primitives.filter((wrapper) => wrapper.primitive() !== source);
        if (source.detached) {
            source.detached();
        }
        this._model.lightUpdate();
    }
    primitives() {
        return this._primitives;
    }
    primitiveHitTest(x, y) {
        return this._primitives
            .map((primitive) => primitive.hitTest(x, y))
            .filter((result) => result !== null);
    }
    _recalculatePriceScaleImpl(priceScale) {
        // TODO: can use this checks
        const sourceForAutoScale = priceScale.sourcesForAutoScale();
        if (sourceForAutoScale && sourceForAutoScale.length > 0 && !this._timeScale.isEmpty()) {
            const visibleBars = this._timeScale.visibleStrictRange();
            if (visibleBars !== null) {
                priceScale.recalculatePriceRange(visibleBars);
            }
        }
        priceScale.updateAllViews();
    }
    _insertDataSource(source, priceScaleId, order) {
        let priceScale = this.priceScaleById(priceScaleId);
        if (priceScale === null) {
            priceScale = this._createPriceScale(priceScaleId, this._model.options().overlayPriceScales);
        }
        this._dataSources.splice(order, 0, source);
        if (!isDefaultPriceScale(priceScaleId)) {
            const overlaySources = this._overlaySourcesByScaleId.get(priceScaleId) || [];
            overlaySources.push(source);
            this._overlaySourcesByScaleId.set(priceScaleId, overlaySources);
        }
        source.setZorder(order);
        priceScale.addDataSource(source);
        source.setPriceScale(priceScale);
        this.recalculatePriceScale(priceScale);
        this._cachedOrderedSources = null;
    }
    _onPriceScaleModeChanged(priceScale, oldMode, newMode) {
        if (oldMode.mode === newMode.mode) {
            return;
        }
        // momentary auto scale if we toggle percentage/indexedTo100 mode
        this._recalculatePriceScaleImpl(priceScale);
    }
    _createPriceScale(id, options) {
        const actualOptions = { visible: true, autoScale: true, ...clone(options) };
        const priceScale = new PriceScale(id, actualOptions, this._model.options()['layout'], this._model.options().localization, this._model.colorParser());
        priceScale.setHeight(this.height());
        return priceScale;
    }
}
