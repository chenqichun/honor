import { ensure, ensureNotNull } from '../helpers/assertions';
const barStyleFnMap = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Bar: (findBar, barStyle, barIndex, precomputedBars) => {
        const upColor = barStyle.upColor;
        const downColor = barStyle.downColor;
        const currentBar = ensureNotNull(findBar(barIndex, precomputedBars));
        const isUp = ensure(currentBar.value[0 /* PlotRowValueIndex.Open */]) <= ensure(currentBar.value[3 /* PlotRowValueIndex.Close */]);
        return {
            barColor: currentBar.color ?? (isUp ? upColor : downColor),
        };
    },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Candlestick: (findBar, candlestickStyle, barIndex, precomputedBars) => {
        const upColor = candlestickStyle.upColor;
        const downColor = candlestickStyle.downColor;
        const borderUpColor = candlestickStyle.borderUpColor;
        const borderDownColor = candlestickStyle.borderDownColor;
        const wickUpColor = candlestickStyle.wickUpColor;
        const wickDownColor = candlestickStyle.wickDownColor;
        const currentBar = ensureNotNull(findBar(barIndex, precomputedBars));
        const isUp = ensure(currentBar.value[0 /* PlotRowValueIndex.Open */]) <= ensure(currentBar.value[3 /* PlotRowValueIndex.Close */]);
        return {
            barColor: currentBar.color ?? (isUp ? upColor : downColor),
            barBorderColor: currentBar.borderColor ?? (isUp ? borderUpColor : borderDownColor),
            barWickColor: currentBar.wickColor ?? (isUp ? wickUpColor : wickDownColor),
        };
    },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Custom: (findBar, customStyle, barIndex, precomputedBars) => {
        const currentBar = ensureNotNull(findBar(barIndex, precomputedBars));
        return {
            barColor: currentBar.color ?? customStyle.color,
        };
    },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Area: (findBar, areaStyle, barIndex, precomputedBars) => {
        const currentBar = ensureNotNull(findBar(barIndex, precomputedBars));
        return {
            barColor: currentBar.lineColor ?? areaStyle.lineColor,
            lineColor: currentBar.lineColor ?? areaStyle.lineColor,
            topColor: currentBar.topColor ?? areaStyle.topColor,
            bottomColor: currentBar.bottomColor ?? areaStyle.bottomColor,
        };
    },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Baseline: (findBar, baselineStyle, barIndex, precomputedBars) => {
        const currentBar = ensureNotNull(findBar(barIndex, precomputedBars));
        const isAboveBaseline = currentBar.value[3 /* PlotRowValueIndex.Close */] >= baselineStyle.baseValue.price;
        return {
            barColor: isAboveBaseline ? baselineStyle.topLineColor : baselineStyle.bottomLineColor,
            topLineColor: currentBar.topLineColor ?? baselineStyle.topLineColor,
            bottomLineColor: currentBar.bottomLineColor ?? baselineStyle.bottomLineColor,
            topFillColor1: currentBar.topFillColor1 ?? baselineStyle.topFillColor1,
            topFillColor2: currentBar.topFillColor2 ?? baselineStyle.topFillColor2,
            bottomFillColor1: currentBar.bottomFillColor1 ?? baselineStyle.bottomFillColor1,
            bottomFillColor2: currentBar.bottomFillColor2 ?? baselineStyle.bottomFillColor2,
        };
    },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Line: (findBar, lineStyle, barIndex, precomputedBars) => {
        const currentBar = ensureNotNull(findBar(barIndex, precomputedBars));
        return {
            barColor: currentBar.color ?? lineStyle.color,
            lineColor: currentBar.color ?? lineStyle.color,
        };
    },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Histogram: (findBar, histogramStyle, barIndex, precomputedBars) => {
        const currentBar = ensureNotNull(findBar(barIndex, precomputedBars));
        return {
            barColor: currentBar.color ?? histogramStyle.color,
        };
    },
};
export class SeriesBarColorer {
    _series;
    _styleGetter;
    constructor(series) {
        this._series = series;
        this._styleGetter = barStyleFnMap[series.seriesType()];
    }
    barStyle(barIndex, precomputedBars) {
        // precomputedBars: {value: [Array BarValues], previousValue: [Array BarValues] | undefined}
        // Used to avoid binary search if bars are already known
        return this._styleGetter(this._findBar, this._series.options(), barIndex, precomputedBars);
    }
    _findBar = (barIndex, precomputedBars) => {
        if (precomputedBars !== undefined) {
            return precomputedBars.value;
        }
        return this._series.bars().valueAt(barIndex);
    };
}
