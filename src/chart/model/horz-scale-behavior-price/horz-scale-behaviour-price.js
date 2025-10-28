function markWithGreaterWeight(a, b) {
    return a.weight > b.weight ? a : b;
}
export class HorzScaleBehaviorPrice {
    _options;
    options() {
        return this._options;
    }
    setOptions(options) {
        this._options = options;
    }
    preprocessData(data) { }
    updateFormatter(options) {
        if (!this._options) {
            return;
        }
        this._options.localization = options;
    }
    createConverterToInternalObj(data) {
        return (price) => price;
    }
    key(internalItem) {
        return internalItem;
    }
    cacheKey(internalItem) {
        return internalItem;
    }
    convertHorzItemToInternal(item) {
        return item;
    }
    formatHorzItem(item) {
        return item.toFixed(this._precision());
    }
    formatTickmark(item, localizationOptions) {
        return item.time.toFixed(this._precision());
    }
    maxTickMarkWeight(marks) {
        return marks.reduce(markWithGreaterWeight, marks[0]).weight;
    }
    fillWeightsForPoints(sortedTimePoints, startIndex) {
        const priceWeight = (price) => {
            if (price === Math.ceil(price / 100) * 100) {
                return 8;
            }
            if (price === Math.ceil(price / 50) * 50) {
                return 7;
            }
            if (price === Math.ceil(price / 25) * 25) {
                return 6;
            }
            if (price === Math.ceil(price / 10) * 10) {
                return 5;
            }
            if (price === Math.ceil(price / 5) * 5) {
                return 4;
            }
            if (price === Math.ceil(price)) {
                return 3;
            }
            if (price * 2 === Math.ceil(price * 2)) {
                return 1;
            }
            return 0;
        };
        for (let index = startIndex; index < sortedTimePoints.length; ++index) {
            sortedTimePoints[index].timeWeight = priceWeight(sortedTimePoints[index].time);
        }
    }
    _precision() {
        return this._options.localization
            .precision;
    }
}
