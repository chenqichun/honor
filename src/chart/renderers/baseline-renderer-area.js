import { PaneRendererAreaBase } from './area-renderer-base';
import { GradientStyleCache } from './gradient-style-cache';
export class PaneRendererBaselineArea extends PaneRendererAreaBase {
    _fillCache = new GradientStyleCache();
    _fillStyle(renderingScope, item) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const data = this._data;
        return this._fillCache.get(renderingScope, {
            topColor1: item.topFillColor1,
            topColor2: item.topFillColor2,
            bottomColor1: item.bottomFillColor1,
            bottomColor2: item.bottomFillColor2,
            baseLevelCoordinate: data.baseLevelCoordinate,
            topCoordinate: data.topCoordinate ?? 0,
            bottomCoordinate: data.bottomCoordinate ?? renderingScope.bitmapSize.height,
        });
    }
}
