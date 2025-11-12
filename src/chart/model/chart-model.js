/// <reference types="_build-time-constants" />
import { assert, ensureNotNull } from '../helpers/assertions';
import { Delegate } from '../helpers/delegate';
import { merge } from '../helpers/strict-type-checks';
import { PriceAxisRendererOptionsProvider } from '../renderers/price-axis-renderer-options-provider';
import { ColorParser } from './colors';
import { Crosshair } from './crosshair';
import { isDefaultPriceScale } from './default-price-scale';
import { InvalidateMask } from './invalidate-mask';
import { Magnet } from './magnet';
import { DEFAULT_STRETCH_FACTOR, MIN_PANE_HEIGHT, Pane } from './pane';
import { hitTestPane } from './pane-hit-test';
import { TimeScale } from './time-scale';
function isPanePrimitive(source) {
    return source instanceof Pane;
}
export class ChartModel {
    _options;
    _invalidateHandler;
    _rendererOptionsProvider;
    _timeScale;
    _panes = [];
    _crosshair;
    _magnet;
    _serieses = [];
    _width = 0;
    _hoveredSource = null;
    _priceScalesOptionsChanged = new Delegate();
    _crosshairMoved = new Delegate();
    _backgroundTopColor;
    _backgroundBottomColor;
    _gradientColorsCache = null;
    _horzScaleBehavior;
    _colorParser;
    constructor(invalidateHandler, options, horzScaleBehavior) {
        this._invalidateHandler = invalidateHandler;
        this._options = options;
        this._horzScaleBehavior = horzScaleBehavior;
        this._colorParser = new ColorParser(this._options.layout.colorParsers);
        this._rendererOptionsProvider = new PriceAxisRendererOptionsProvider(this);
        this._timeScale = new TimeScale(this, options.timeScale, this._options.localization, horzScaleBehavior);
        this._crosshair = new Crosshair(this, options.crosshair);
        this._magnet = new Magnet(options.crosshair);
        if (options.addDefaultPane) {
            this._getOrCreatePane(0);
            this._panes[0].setStretchFactor(DEFAULT_STRETCH_FACTOR * 2);
        }
        this._backgroundTopColor = this._getBackgroundColor(0 /* BackgroundColorSide.Top */);
        this._backgroundBottomColor = this._getBackgroundColor(1 /* BackgroundColorSide.Bottom */);
    }
    fullUpdate() {
        this._invalidate(InvalidateMask.full());
    }
    lightUpdate() {
        this._invalidate(InvalidateMask.light());
    }
    cursorUpdate() {
        this._invalidate(new InvalidateMask(1 /* InvalidationLevel.Cursor */));
    }
    updateSource(source) {
        const inv = this._invalidationMaskForSource(source);
        this._invalidate(inv);
    }
    hoveredSource() {
        return this._hoveredSource;
    }
    setHoveredSource(source) {
        if (this._hoveredSource?.source === source?.source && this._hoveredSource?.object?.externalId === source?.object?.externalId) {
            return;
        }
        const prevSource = this._hoveredSource;
        this._hoveredSource = source;
        if (prevSource !== null) {
            this.updateSource(prevSource.source);
        }
        // additional check to prevent unnecessary updates of same source
        if (source !== null && source.source !== prevSource?.source) {
            this.updateSource(source.source);
        }
    }
    options() {
        return this._options;
    }
    applyOptions(options) {
        merge(this._options, options);
        this._panes.forEach((p) => p.applyScaleOptions(options));
        if (options.timeScale !== undefined) {
            this._timeScale.applyOptions(options.timeScale);
        }
        if (options.localization !== undefined) {
            this._timeScale.applyLocalizationOptions(options.localization);
        }
        if (options.leftPriceScale || options.rightPriceScale) {
            this._priceScalesOptionsChanged.fire();
        }
        this._backgroundTopColor = this._getBackgroundColor(0 /* BackgroundColorSide.Top */);
        this._backgroundBottomColor = this._getBackgroundColor(1 /* BackgroundColorSide.Bottom */);
        this.fullUpdate();
    }
    applyPriceScaleOptions(priceScaleId, options, paneIndex = 0) {
        const pane = this._panes[paneIndex];
        if (pane === undefined) {
            if (process.env.NODE_ENV === 'development') {
                throw new Error(`Trying to apply price scale options with incorrect pane index: ${paneIndex}`);
            }
            return;
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        if (priceScaleId === "left" /* DefaultPriceScaleId.Left */) {
            merge(this._options, {
                leftPriceScale: options,
            });
            pane.applyScaleOptions({
                leftPriceScale: options,
            });
            this._priceScalesOptionsChanged.fire();
            this.fullUpdate();
            return;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        }
        else if (priceScaleId === "right" /* DefaultPriceScaleId.Right */) {
            merge(this._options, {
                rightPriceScale: options,
            });
            pane.applyScaleOptions({
                rightPriceScale: options,
            });
            this._priceScalesOptionsChanged.fire();
            this.fullUpdate();
            return;
        }
        const res = this.findPriceScale(priceScaleId, paneIndex);
        if (res === null) {
            if (process.env.NODE_ENV === 'development') {
                throw new Error(`Trying to apply price scale options with incorrect ID: ${priceScaleId}`);
            }
            return;
        }
        res.priceScale.applyOptions(options);
        this._priceScalesOptionsChanged.fire();
    }
    findPriceScale(priceScaleId, paneIndex) {
        const pane = this._panes[paneIndex];
        if (pane === undefined) {
            return null;
        }
        const priceScale = pane.priceScaleById(priceScaleId);
        if (priceScale !== null) {
            return {
                pane,
                priceScale,
            };
        }
        return null;
    }
    timeScale() {
        return this._timeScale;
    }
    panes() {
        return this._panes;
    }
    crosshairSource() {
        return this._crosshair;
    }
    crosshairMoved() {
        return this._crosshairMoved;
    }
    setPaneHeight(pane, height) {
        pane.setHeight(height);
        this.recalculateAllPanes();
    }
    setWidth(width) {
        this._width = width;
        this._timeScale.setWidth(this._width);
        this._panes.forEach((pane) => pane.setWidth(width));
        this.recalculateAllPanes();
    }
    removePane(index) {
        if (this._panes.length === 1) {
            return;
        }
        assert(index >= 0 && index < this._panes.length, 'Invalid pane index');
        this._panes.splice(index, 1);
        this.fullUpdate();
    }
    changePanesHeight(paneIndex, height) {
        if (this._panes.length < 2) {
            return;
        }
        assert(paneIndex >= 0 && paneIndex < this._panes.length, 'Invalid pane index');
        const targetPane = this._panes[paneIndex];
        const totalStretch = this._panes.reduce((prevValue, pane) => prevValue + pane.stretchFactor(), 0);
        const totalHeight = this._panes.reduce((prevValue, pane) => prevValue + pane.height(), 0);
        const maxPaneHeight = totalHeight - MIN_PANE_HEIGHT * (this._panes.length - 1);
        height = Math.min(maxPaneHeight, Math.max(MIN_PANE_HEIGHT, height));
        const pixelStretchFactor = totalStretch / totalHeight;
        const oldHeight = targetPane.height();
        targetPane.setStretchFactor(height * pixelStretchFactor);
        let otherPanesChange = height - oldHeight;
        let panesCount = this._panes.length - 1;
        for (const pane of this._panes) {
            if (pane !== targetPane) {
                const newPaneHeight = Math.min(maxPaneHeight, Math.max(30, pane.height() - otherPanesChange / panesCount));
                otherPanesChange -= (pane.height() - newPaneHeight);
                panesCount -= 1;
                const newStretchFactor = newPaneHeight * pixelStretchFactor;
                pane.setStretchFactor(newStretchFactor);
            }
        }
        this.fullUpdate();
    }
    swapPanes(first, second) {
        assert(first >= 0 && first < this._panes.length && second >= 0 && second < this._panes.length, 'Invalid pane index');
        const firstPane = this._panes[first];
        const secondPane = this._panes[second];
        this._panes[first] = secondPane;
        this._panes[second] = firstPane;
        this.fullUpdate();
    }
    movePane(from, to) {
        assert(from >= 0 && from < this._panes.length && to >= 0 && to < this._panes.length, 'Invalid pane index');
        if (from === to) {
            return;
        }
        const [paneToMove] = this._panes.splice(from, 1);
        this._panes.splice(to, 0, paneToMove);
        this.fullUpdate();
    }
    startScalePrice(pane, priceScale, x) {
        pane.startScalePrice(priceScale, x);
    }
    scalePriceTo(pane, priceScale, x) {
        pane.scalePriceTo(priceScale, x);
        
        this.updateCrosshair();
        this._invalidate(this._paneInvalidationMask(pane, 2 /* InvalidationLevel.Light */));
    }
    endScalePrice(pane, priceScale) {
        pane.endScalePrice(priceScale);
        this._invalidate(this._paneInvalidationMask(pane, 2 /* InvalidationLevel.Light */));
    }
    startScrollPrice(pane, priceScale, x) {
        if (priceScale.isAutoScale()) {
            return;
        }
        pane.startScrollPrice(priceScale, x);
    }
    scrollPriceTo(pane, priceScale, x) {
        if (priceScale.isAutoScale()) {
            return;
        }
        pane.scrollPriceTo(priceScale, x);
        this.updateCrosshair();
        this._invalidate(this._paneInvalidationMask(pane, 2 /* InvalidationLevel.Light */));
    }
    endScrollPrice(pane, priceScale) {
        if (priceScale.isAutoScale()) {
            return;
        }
        pane.endScrollPrice(priceScale);
        this._invalidate(this._paneInvalidationMask(pane, 2 /* InvalidationLevel.Light */));
    }
    resetPriceScale(pane, priceScale) {
        pane.resetPriceScale(priceScale);
        this._invalidate(this._paneInvalidationMask(pane, 2 /* InvalidationLevel.Light */));
    }
    startScaleTime(position) {
        this._timeScale.startScale(position);
    }
    /**
     * Zoom in/out the chart (depends on scale value).
     *
     * @param pointX - X coordinate of the point to apply the zoom (the point which should stay on its place)
     * @param scale - Zoom value. Negative value means zoom out, positive - zoom in.
     */
    zoomTime(pointX, scale) {
        const timeScale = this.timeScale();
        if (timeScale.isEmpty() || scale === 0) {
            return;
        }
        const timeScaleWidth = timeScale.width();
        pointX = Math.max(1, Math.min(pointX, timeScaleWidth));
        timeScale.zoom(pointX, scale);
        this.recalculateAllPanes();
    }
    scrollChart(x) {
        this.startScrollTime(0);
        this.scrollTimeTo(x);
        this.endScrollTime();
    }
    scaleTimeTo(x) {
        this._timeScale.scaleTo(x);
        this.recalculateAllPanes();
    }
    endScaleTime() {
        this._timeScale.endScale();
        this.lightUpdate();
    }
    startScrollTime(x) {
        this._timeScale.startScroll(x);
    }
    scrollTimeTo(x) {
        this._timeScale.scrollTo(x);
        this.recalculateAllPanes();
    }
    endScrollTime() {
        this._timeScale.endScroll();
        this.lightUpdate();
    }
    serieses() {
        return this._serieses;
    }
    setAndSaveCurrentPosition(x, y, event, pane, skipEvent) {
        this._crosshair.saveOriginCoord(x, y);
        let price = NaN;
        let index = this._timeScale.coordinateToIndex(x, true);
        const visibleBars = this._timeScale.visibleStrictRange();
        if (visibleBars !== null) {
            index = Math.min(Math.max(visibleBars.left(), index), visibleBars.right());
        }
        const priceScale = pane.defaultPriceScale();
        const firstValue = priceScale.firstValue();
        if (firstValue !== null) {
            price = priceScale.coordinateToPrice(y, firstValue);
        }
        price = this._magnet.align(price, index, pane);
        this._crosshair.setPosition(index, price, pane);
        this.cursorUpdate();
        if (!skipEvent) {
            const hitTest = hitTestPane(pane, x, y);
            this.setHoveredSource(hitTest && { source: hitTest.source, object: hitTest.object, cursorStyle: hitTest.cursorStyle || null });
            this._crosshairMoved.fire(this._crosshair.appliedIndex(), { x, y }, event);
        }
    }
    // A position provided external (not from an internal event listener)
    setAndSaveSyntheticPosition(price, horizontalPosition, pane) {
        const priceScale = pane.defaultPriceScale();
        const firstValue = priceScale.firstValue();
        const y = priceScale.priceToCoordinate(price, ensureNotNull(firstValue));
        const index = this._timeScale.timeToIndex(horizontalPosition, true);
        const x = this._timeScale.indexToCoordinate(ensureNotNull(index));
        this.setAndSaveCurrentPosition(x, y, null, pane, true);
    }
    clearCurrentPosition(skipEvent) {
        const crosshair = this.crosshairSource();
        crosshair.clearPosition();
        this.cursorUpdate();
        if (!skipEvent) {
            this._crosshairMoved.fire(null, null, null);
        }
    }
    updateCrosshair() {
        // apply magnet
        const pane = this._crosshair.pane();
        if (pane !== null) {
            const x = this._crosshair.originCoordX();
            const y = this._crosshair.originCoordY();
            this.setAndSaveCurrentPosition(x, y, null, pane);
        }
        this._crosshair.updateAllViews();
    }
    updateTimeScale(newBaseIndex, newPoints, firstChangedPointIndex) {
        const oldFirstTime = this._timeScale.indexToTime(0);
        if (newPoints !== undefined && firstChangedPointIndex !== undefined) {
            this._timeScale.update(newPoints, firstChangedPointIndex);
        }
        const newFirstTime = this._timeScale.indexToTime(0);
        const currentBaseIndex = this._timeScale.baseIndex();
        const visibleBars = this._timeScale.visibleStrictRange();
        // if time scale cannot return current visible bars range (e.g. time scale has zero-width)
        // then we do not need to update right offset to shift visible bars range to have the same right offset as we have before new bar
        // (and actually we cannot)
        if (visibleBars !== null && oldFirstTime !== null && newFirstTime !== null) {
            const isLastSeriesBarVisible = visibleBars.contains(currentBaseIndex);
            const isLeftBarShiftToLeft = this._horzScaleBehavior.key(oldFirstTime) > this._horzScaleBehavior.key(newFirstTime);
            const isSeriesPointsAdded = newBaseIndex !== null && newBaseIndex > currentBaseIndex;
            const isSeriesPointsAddedToRight = isSeriesPointsAdded && !isLeftBarShiftToLeft;
            const allowShiftWhenReplacingWhitespace = this._timeScale.options().allowShiftVisibleRangeOnWhitespaceReplacement;
            const replacedExistingWhitespace = firstChangedPointIndex === undefined;
            const needShiftVisibleRangeOnNewBar = isLastSeriesBarVisible && (!replacedExistingWhitespace || allowShiftWhenReplacingWhitespace) && this._timeScale.options().shiftVisibleRangeOnNewBar;
            if (isSeriesPointsAddedToRight && !needShiftVisibleRangeOnNewBar) {
                const compensationShift = newBaseIndex - currentBaseIndex;
                this._timeScale.setRightOffset(this._timeScale.rightOffset() - compensationShift);
            }
        }
        this._timeScale.setBaseIndex(newBaseIndex);
    }
    recalculatePane(pane) {
        if (pane !== null) {
            pane.recalculate();
        }
    }
    paneForSource(source) {
        if (isPanePrimitive(source)) {
            return source;
        }
        const pane = this._panes.find((p) => p.orderedSources().includes(source));
        return pane === undefined ? null : pane;
    }
    recalculateAllPanes() {
        this._panes.forEach((p) => p.recalculate());
        this.updateCrosshair();
    }
    destroy() {
        this._panes.forEach((p) => p.destroy());
        this._panes.length = 0;
        // to avoid memleaks
        this._options.localization.priceFormatter = undefined;
        this._options.localization.percentageFormatter = undefined;
        this._options.localization.timeFormatter = undefined;
    }
    rendererOptionsProvider() {
        return this._rendererOptionsProvider;
    }
    priceAxisRendererOptions() {
        return this._rendererOptionsProvider.options();
    }
    priceScalesOptionsChanged() {
        return this._priceScalesOptionsChanged;
    }
    addSeriesToPane(series, paneIndex) {
        const pane = this._getOrCreatePane(paneIndex);
        this._addSeriesToPane(series, pane);
        this._serieses.push(series);
        if (this._serieses.length === 1) {
            // call fullUpdate to recalculate chart's parts geometry
            this.fullUpdate();
        }
        else {
            this.lightUpdate();
        }
    }
    removeSeries(series) {
        const pane = this.paneForSource(series);
        const seriesIndex = this._serieses.indexOf(series);
        assert(seriesIndex !== -1, 'Series not found');
        const paneImpl = ensureNotNull(pane);
        this._serieses.splice(seriesIndex, 1);
        paneImpl.removeDataSource(series);
        if (series.destroy) {
            series.destroy();
        }
        this._timeScale.recalculateIndicesWithData();
        this._cleanupIfPaneIsEmpty(paneImpl);
    }
    moveSeriesToScale(series, targetScaleId) {
        const pane = ensureNotNull(this.paneForSource(series));
        pane.removeDataSource(series, true);
        pane.addDataSource(series, targetScaleId, true);
    }
    fitContent() {
        const mask = InvalidateMask.light();
        mask.setFitContent();
        this._invalidate(mask);
    }
    setTargetLogicalRange(range) {
        const mask = InvalidateMask.light();
        mask.applyRange(range);
        this._invalidate(mask);
    }
    resetTimeScale() {
        const mask = InvalidateMask.light();
        mask.resetTimeScale();
        this._invalidate(mask);
    }
    setBarSpacing(spacing) {
        const mask = InvalidateMask.light();
        mask.setBarSpacing(spacing);
        this._invalidate(mask);
    }
    setRightOffset(offset) {
        // InvalidateMask
        const mask = InvalidateMask.light();
        mask.setRightOffset(offset);
        this._invalidate(mask);
    }
    setTimeScaleAnimation(animation) {
        const mask = InvalidateMask.light();
        mask.setTimeScaleAnimation(animation);
        this._invalidate(mask);
    }
    stopTimeScaleAnimation() {
        const mask = InvalidateMask.light();
        mask.stopTimeScaleAnimation();
        this._invalidate(mask);
    }
    defaultVisiblePriceScaleId() {
        return this._options.rightPriceScale.visible ? "right" /* DefaultPriceScaleId.Right */ : "left" /* DefaultPriceScaleId.Left */;
    }
    moveSeriesToPane(series, newPaneIndex) {
        assert(newPaneIndex >= 0, 'Index should be greater or equal to 0');
        const fromPaneIndex = this._seriesPaneIndex(series);
        if (newPaneIndex === fromPaneIndex) {
            return;
        }
        const previousPane = ensureNotNull(this.paneForSource(series));
        previousPane.removeDataSource(series);
        const newPane = this._getOrCreatePane(newPaneIndex);
        this._addSeriesToPane(series, newPane);
        if (previousPane.dataSources().length === 0) {
            this._cleanupIfPaneIsEmpty(previousPane);
        }
        this.fullUpdate();
    }
    backgroundBottomColor() {
        return this._backgroundBottomColor;
    }
    backgroundTopColor() {
        return this._backgroundTopColor;
    }
    backgroundColorAtYPercentFromTop(percent) {
        const bottomColor = this._backgroundBottomColor;
        const topColor = this._backgroundTopColor;
        if (bottomColor === topColor) {
            // solid background
            return bottomColor;
        }
        // gradient background
        // percent should be from 0 to 100 (we're using only integer values to make cache more efficient)
        percent = Math.max(0, Math.min(100, Math.round(percent * 100)));
        if (this._gradientColorsCache === null ||
            this._gradientColorsCache.topColor !== topColor || this._gradientColorsCache.bottomColor !== bottomColor) {
            this._gradientColorsCache = {
                topColor: topColor,
                bottomColor: bottomColor,
                colors: new Map(),
            };
        }
        else {
            const cachedValue = this._gradientColorsCache.colors.get(percent);
            if (cachedValue !== undefined) {
                return cachedValue;
            }
        }
        const result = this._colorParser.gradientColorAtPercent(topColor, bottomColor, percent / 100);
        this._gradientColorsCache.colors.set(percent, result);
        return result;
    }
    getPaneIndex(pane) {
        return this._panes.indexOf(pane);
    }
    colorParser() {
        return this._colorParser;
    }
    addPane() {
        return this._addPane();
    }
    _addPane(index) {
        const pane = new Pane(this._timeScale, this);
        this._panes.push(pane);
        const idx = index ?? this._panes.length - 1;
        // we always do autoscaling on the creation
        // if autoscale option is true, it is ok, just recalculate by invalidation mask
        // if autoscale option is false, autoscale anyway on the first draw
        // also there is a scenario when autoscale is true in constructor and false later on applyOptions
        const mask = InvalidateMask.full();
        mask.invalidatePane(idx, {
            level: 0 /* InvalidationLevel.None */,
            autoScale: true,
        });
        this._invalidate(mask);
        return pane;
    }
    _getOrCreatePane(index) {
        assert(index >= 0, 'Index should be greater or equal to 0');
        index = Math.min(this._panes.length, index);
        if (index < this._panes.length) {
            return this._panes[index];
        }
        return this._addPane(index);
    }
    _seriesPaneIndex(series) {
        return this._panes.findIndex((pane) => pane.series().includes(series));
    }
    _paneInvalidationMask(pane, level) {
        const inv = new InvalidateMask(level);
        if (pane !== null) {
            const index = this._panes.indexOf(pane);
            inv.invalidatePane(index, {
                level,
            });
        }
        return inv;
    }
    _invalidationMaskForSource(source, invalidateType) {
        if (invalidateType === undefined) {
            invalidateType = 2 /* InvalidationLevel.Light */;
        }
        return this._paneInvalidationMask(this.paneForSource(source), invalidateType);
    }
    _invalidate(mask) {
        if (this._invalidateHandler) {
            this._invalidateHandler(mask);
        }
        this._panes.forEach((pane) => pane.grid().paneView().update());
    }
    _addSeriesToPane(series, pane) {
        const priceScaleId = series.options().priceScaleId;
        const targetScaleId = priceScaleId !== undefined ? priceScaleId : this.defaultVisiblePriceScaleId();
        pane.addDataSource(series, targetScaleId);
        if (!isDefaultPriceScale(targetScaleId)) {
            // let's apply that options again to apply margins
            series.applyOptions(series.options());
        }
    }
    _getBackgroundColor(side) {
        const layoutOptions = this._options['layout'];
        if (layoutOptions.background.type === "gradient" /* ColorType.VerticalGradient */) {
            return side === 0 /* BackgroundColorSide.Top */ ?
                layoutOptions.background.topColor :
                layoutOptions.background.bottomColor;
        }
        return layoutOptions.background.color;
    }
    _cleanupIfPaneIsEmpty(pane) {
        if (!pane.preserveEmptyPane() && (pane.dataSources().length === 0 && this._panes.length > 1)) {
            this._panes.splice(this.getPaneIndex(pane), 1);
        }
    }
}
