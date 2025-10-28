import { merge } from '../helpers/strict-type-checks';
import { lineSeries } from '../model/series/line-series';
import { YieldCurveHorzScaleBehavior } from '../model/yield-curve-horz-scale-behavior/yield-curve-horz-scale-behavior';
import { ChartApi } from './chart-api';
import { yieldChartOptionsDefaults } from './options/yield-curve-chart-options-defaults';
function generateWhitespaceData({ start, end, resolution, }) {
    return Array.from({ length: Math.floor((end - start) / resolution) + 1 }, 
    // eslint-disable-next-line quote-props
    (item, i) => ({ 'time': start + i * resolution }));
}
function buildWhitespaceState(options, lastIndex) {
    return {
        start: Math.max(0, options.startTimeRange),
        end: Math.max(0, options.minimumTimeRange, lastIndex || 0),
        resolution: Math.max(1, options.baseResolution),
    };
}
const generateWhitespaceHash = ({ start, end, resolution, }) => `${start}~${end}~${resolution}`;
const defaultOptions = {
    yieldCurve: yieldChartOptionsDefaults,
    // and add sensible default options for yield charts which
    // are different from the usual defaults.
    timeScale: {
        ignoreWhitespaceIndices: true,
    },
    leftPriceScale: {
        visible: true,
    },
    rightPriceScale: {
        visible: false,
    },
    localization: {
        priceFormatter: (value) => {
            return value.toFixed(3) + '%';
        },
    },
};
const lineStyleDefaultOptionOverrides = {
    lastValueVisible: false,
    priceLineVisible: false,
};
export class YieldChartApi extends ChartApi {
    constructor(container, options) {
        const fullOptions = merge(defaultOptions, options || {});
        const horzBehaviour = new YieldCurveHorzScaleBehavior();
        super(container, horzBehaviour, fullOptions);
        horzBehaviour.setOptions(this.options());
        this._initWhitespaceSeries();
    }
    addSeries(definition, options = {}, paneIndex = 0) {
        if (definition.isBuiltIn && ['Area', 'Line'].includes(definition.type) === false) {
            throw new Error('Yield curve only support Area and Line series');
        }
        const optionOverrides = {
            ...lineStyleDefaultOptionOverrides,
            ...options,
        };
        return super.addSeries(definition, optionOverrides, paneIndex);
    }
    _initWhitespaceSeries() {
        const horzBehaviour = this.horzBehaviour();
        const whiteSpaceSeries = this.addSeries(lineSeries);
        let currentWhitespaceHash;
        function updateWhitespace(lastIndex) {
            const newWhitespaceState = buildWhitespaceState(horzBehaviour.options().yieldCurve, lastIndex);
            const newWhitespaceHash = generateWhitespaceHash(newWhitespaceState);
            if (newWhitespaceHash !== currentWhitespaceHash) {
                currentWhitespaceHash = newWhitespaceHash;
                whiteSpaceSeries.setData(generateWhitespaceData(newWhitespaceState));
            }
        }
        updateWhitespace(0);
        horzBehaviour.whitespaceInvalidated().subscribe(updateWhitespace);
    }
}
