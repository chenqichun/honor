import { Delegate } from '../../helpers/delegate';
function createDebouncedMicroTaskHandler(callback) {
    let scheduled = false;
    return function (...args) {
        if (!scheduled) {
            scheduled = true;
            queueMicrotask(() => {
                callback(...args);
                scheduled = false;
            });
        }
    };
}
function markWithGreaterWeight(a, b) {
    return a.weight > b.weight ? a : b;
}
function toInternalHorzScaleItem(item) {
    return item;
}
function fromInternalHorzScaleItem(item) {
    return item;
}
export class YieldCurveHorzScaleBehavior {
    _options;
    _pointsChangedDelegate = new Delegate();
    _invalidateWhitespace = createDebouncedMicroTaskHandler(() => this._pointsChangedDelegate.fire(this._largestIndex));
    _largestIndex = 0;
    /** Data changes might require that the whitespace be generated again */
    whitespaceInvalidated() {
        return this._pointsChangedDelegate;
    }
    destroy() {
        this._pointsChangedDelegate.destroy();
    }
    options() {
        return this._options;
    }
    setOptions(options) {
        this._options = options;
    }
    preprocessData(data) {
        // No preprocessing needed for yield curve data
    }
    updateFormatter(options) {
        if (!this._options) {
            return;
        }
        this._options.localization = options;
    }
    createConverterToInternalObj(data) {
        this._invalidateWhitespace();
        return (time) => {
            if (time > this._largestIndex) {
                this._largestIndex = time;
            }
            return toInternalHorzScaleItem(time);
        };
    }
    key(internalItem) {
        return internalItem;
    }
    cacheKey(internalItem) {
        return fromInternalHorzScaleItem(internalItem);
    }
    convertHorzItemToInternal(item) {
        return toInternalHorzScaleItem(item);
    }
    formatHorzItem(item) {
        return this._formatTime(item);
    }
    formatTickmark(item) {
        return this._formatTime(item.time);
    }
    maxTickMarkWeight(marks) {
        return marks.reduce(markWithGreaterWeight, marks[0]).weight;
    }
    fillWeightsForPoints(sortedTimePoints, startIndex) {
        const timeWeight = (time) => {
            if (time % 120 === 0) {
                return 10;
            }
            if (time % 60 === 0) {
                return 9;
            }
            if (time % 36 === 0) {
                return 8;
            }
            if (time % 12 === 0) {
                return 7;
            }
            if (time % 6 === 0) {
                return 6;
            }
            if (time % 3 === 0) {
                return 5;
            }
            if (time % 1 === 0) {
                return 4;
            }
            return 0;
        };
        for (let index = startIndex; index < sortedTimePoints.length; ++index) {
            sortedTimePoints[index].timeWeight = timeWeight(fromInternalHorzScaleItem(sortedTimePoints[index].time));
        }
        this._largestIndex = fromInternalHorzScaleItem(sortedTimePoints[sortedTimePoints.length - 1].time);
        this._invalidateWhitespace();
    }
    _formatTime(months) {
        if (this._options.localization?.timeFormatter) {
            return this._options.localization.timeFormatter(months);
        }
        if (months < 12) {
            return `${months}M`;
        }
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        if (remainingMonths === 0) {
            return `${years}Y`;
        }
        return `${years}Y${remainingMonths}M`;
    }
}
