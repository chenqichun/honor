import { clamp } from '../helpers/mathex';
export class GradientStyleCache {
    _params;
    _cachedValue;
    // eslint-disable-next-line complexity
    get(scope, params) {
        const cachedParams = this._params;
        const { topColor1, topColor2, bottomColor1, bottomColor2, baseLevelCoordinate, topCoordinate, bottomCoordinate, } = params;
        if (this._cachedValue === undefined ||
            cachedParams === undefined ||
            cachedParams.topColor1 !== topColor1 ||
            cachedParams.topColor2 !== topColor2 ||
            cachedParams.bottomColor1 !== bottomColor1 ||
            cachedParams.bottomColor2 !== bottomColor2 ||
            cachedParams.baseLevelCoordinate !== baseLevelCoordinate ||
            cachedParams.topCoordinate !== topCoordinate ||
            cachedParams.bottomCoordinate !== bottomCoordinate) {
            const { verticalPixelRatio } = scope;
            const multiplier = baseLevelCoordinate || topCoordinate > 0 ? verticalPixelRatio : 1;
            const top = topCoordinate * multiplier;
            const bottom = bottomCoordinate === scope.bitmapSize.height ? bottomCoordinate : bottomCoordinate * multiplier;
            const baseline = (baseLevelCoordinate ?? 0) * multiplier;
            const gradient = scope.context.createLinearGradient(0, top, 0, bottom);
            gradient.addColorStop(0, topColor1);
            if (baseLevelCoordinate !== null && baseLevelCoordinate !== undefined) {
                const range = bottom - top;
                const baselineRatio = clamp(((baseline - top) / range), 0, 1);
                gradient.addColorStop(baselineRatio, topColor2);
                gradient.addColorStop(baselineRatio, bottomColor1);
            }
            gradient.addColorStop(1, bottomColor2);
            this._cachedValue = gradient;
            this._params = params;
        }
        return this._cachedValue;
    }
}
