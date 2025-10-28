import { TimeAxisViewRenderer } from '../renderers/time-axis-view-renderer';
import { PriceAxisView } from '../views/price-axis/price-axis-view';
import { PrimitiveWrapper } from './pane-primitive-wrapper';
import { drawingUtils } from './primitive-drawing-utils';
class SeriesPrimitiveRendererWrapper {
    _baseRenderer;
    constructor(baseRenderer) {
        this._baseRenderer = baseRenderer;
    }
    draw(target, isHovered, hitTestData) {
        this._baseRenderer.draw(target, drawingUtils);
    }
    drawBackground(target, isHovered, hitTestData) {
        this._baseRenderer.drawBackground?.(target, drawingUtils);
    }
}
class SeriesPrimitivePaneViewWrapper {
    _paneView;
    _cache = null;
    constructor(paneView) {
        this._paneView = paneView;
    }
    renderer() {
        const baseRenderer = this._paneView.renderer();
        if (baseRenderer === null) {
            return null;
        }
        if (this._cache?.base === baseRenderer) {
            return this._cache.wrapper;
        }
        const wrapper = new SeriesPrimitiveRendererWrapper(baseRenderer);
        this._cache = {
            base: baseRenderer,
            wrapper,
        };
        return wrapper;
    }
    zOrder() {
        return this._paneView.zOrder?.() ?? 'normal';
    }
}
function getAxisViewData(baseView) {
    return {
        text: baseView.text(),
        coordinate: baseView.coordinate(),
        fixedCoordinate: baseView.fixedCoordinate?.(),
        color: baseView.textColor(),
        background: baseView.backColor(),
        visible: baseView.visible?.() ?? true,
        tickVisible: baseView.tickVisible?.() ?? true,
    };
}
class SeriesPrimitiveTimeAxisViewWrapper {
    _baseView;
    _timeScale;
    _renderer = new TimeAxisViewRenderer();
    constructor(baseView, timeScale) {
        this._baseView = baseView;
        this._timeScale = timeScale;
    }
    renderer() {
        this._renderer.setData({
            width: this._timeScale.width(),
            ...getAxisViewData(this._baseView),
        });
        return this._renderer;
    }
}
class SeriesPrimitivePriceAxisViewWrapper extends PriceAxisView {
    _baseView;
    _priceScale;
    constructor(baseView, priceScale) {
        super();
        this._baseView = baseView;
        this._priceScale = priceScale;
    }
    _updateRendererData(axisRendererData, paneRendererData, commonRendererData) {
        const data = getAxisViewData(this._baseView);
        commonRendererData.background = data.background;
        axisRendererData.color = data.color;
        const additionalPadding = 2 / 12 * this._priceScale.fontSize();
        commonRendererData.additionalPaddingTop = additionalPadding;
        commonRendererData.additionalPaddingBottom = additionalPadding;
        commonRendererData.coordinate = data.coordinate;
        commonRendererData.fixedCoordinate = data.fixedCoordinate;
        axisRendererData.text = data.text;
        axisRendererData.visible = data.visible;
        axisRendererData.tickVisible = data.tickVisible;
    }
}
export class SeriesPrimitiveWrapper extends PrimitiveWrapper {
    _series;
    _timeAxisViewsCache = null;
    _priceAxisViewsCache = null;
    _priceAxisPaneViewsCache = null;
    _timeAxisPaneViewsCache = null;
    constructor(primitive, series) {
        super(primitive);
        this._series = series;
    }
    timeAxisViews() {
        const base = this._primitive.timeAxisViews?.() ?? [];
        if (this._timeAxisViewsCache?.base === base) {
            return this._timeAxisViewsCache.wrapper;
        }
        const timeScale = this._series.model().timeScale();
        const wrapper = base.map((aw) => new SeriesPrimitiveTimeAxisViewWrapper(aw, timeScale));
        this._timeAxisViewsCache = {
            base,
            wrapper,
        };
        return wrapper;
    }
    priceAxisViews() {
        const base = this._primitive.priceAxisViews?.() ?? [];
        if (this._priceAxisViewsCache?.base === base) {
            return this._priceAxisViewsCache.wrapper;
        }
        const priceScale = this._series.priceScale();
        const wrapper = base.map((aw) => new SeriesPrimitivePriceAxisViewWrapper(aw, priceScale));
        this._priceAxisViewsCache = {
            base,
            wrapper,
        };
        return wrapper;
    }
    priceAxisPaneViews() {
        const base = this._primitive.priceAxisPaneViews?.() ?? [];
        if (this._priceAxisPaneViewsCache?.base === base) {
            return this._priceAxisPaneViewsCache.wrapper;
        }
        const wrapper = base.map((pw) => new SeriesPrimitivePaneViewWrapper(pw));
        this._priceAxisPaneViewsCache = {
            base,
            wrapper,
        };
        return wrapper;
    }
    timeAxisPaneViews() {
        const base = this._primitive.timeAxisPaneViews?.() ?? [];
        if (this._timeAxisPaneViewsCache?.base === base) {
            return this._timeAxisPaneViewsCache.wrapper;
        }
        const wrapper = base.map((pw) => new SeriesPrimitivePaneViewWrapper(pw));
        this._timeAxisPaneViewsCache = {
            base,
            wrapper,
        };
        return wrapper;
    }
    autoscaleInfo(startTimePoint, endTimePoint) {
        return (this._primitive.autoscaleInfo?.(startTimePoint, endTimePoint) ?? null);
    }
}
