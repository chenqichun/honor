import { drawingUtils } from './primitive-drawing-utils';
class PrimitiveRendererWrapper {
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
class PrimitivePaneViewWrapper {
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
        const wrapper = new PrimitiveRendererWrapper(baseRenderer);
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
export class PrimitiveWrapper {
    _primitive;
    _paneViewsCache = null;
    constructor(primitive) {
        this._primitive = primitive;
    }
    primitive() {
        return this._primitive;
    }
    updateAllViews() {
        this._primitive.updateAllViews?.();
    }
    paneViews() {
        const base = this._primitive.paneViews?.() ?? [];
        if (this._paneViewsCache?.base === base) {
            return this._paneViewsCache.wrapper;
        }
        const wrapper = base.map((pw) => new PrimitivePaneViewWrapper(pw));
        this._paneViewsCache = {
            base,
            wrapper,
        };
        return wrapper;
    }
    hitTest(x, y) {
        return this._primitive.hitTest?.(x, y) ?? null;
    }
}
export class PanePrimitiveWrapper extends PrimitiveWrapper {
    labelPaneViews() {
        return [];
    }
}
