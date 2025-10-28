import { ensureDefined } from '../helpers/assertions';
export class FormattedLabelsCache {
    _format;
    _maxSize;
    _actualSize = 0;
    _usageTick = 1;
    _oldestTick = 1;
    _cache = new Map();
    _tick2Labels = new Map();
    _horzScaleBehavior;
    constructor(format, horzScaleBehavior, size = 50) {
        this._format = format;
        this._horzScaleBehavior = horzScaleBehavior;
        this._maxSize = size;
    }
    format(tickMark) {
        const time = tickMark.time;
        const cacheKey = this._horzScaleBehavior.cacheKey(time);
        const tick = this._cache.get(cacheKey);
        if (tick !== undefined) {
            return tick.string;
        }
        if (this._actualSize === this._maxSize) {
            const oldestValue = this._tick2Labels.get(this._oldestTick);
            this._tick2Labels.delete(this._oldestTick);
            this._cache.delete(ensureDefined(oldestValue));
            this._oldestTick++;
            this._actualSize--;
        }
        const str = this._format(tickMark);
        this._cache.set(cacheKey, { string: str, tick: this._usageTick });
        this._tick2Labels.set(this._usageTick, cacheKey);
        this._actualSize++;
        this._usageTick++;
        return str;
    }
}
