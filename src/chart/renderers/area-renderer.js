import { PaneRendererAreaBase } from './area-renderer-base';
import { GradientStyleCache } from './gradient-style-cache';
export class PaneRendererArea extends PaneRendererAreaBase {
    _fillCache = new GradientStyleCache();
    _fillStyle(renderingScope, item) {
        return this._fillCache.get(renderingScope, {
            topColor1: item.topColor,
            topColor2: '',
            bottomColor1: '',
            bottomColor2: item.bottomColor,
            topCoordinate: this._data?.topCoordinate ?? 0,
            bottomCoordinate: renderingScope.bitmapSize.height,
        });
    }
}
