import { SeriesBaselinePaneView } from './baseline-pane-view';
export const baselineStyleDefaults = {
    baseValue: {
        type: 'price',
        price: 0,
    },
    relativeGradient: false,
    topFillColor1: 'rgba(38, 166, 154, 0.28)',
    topFillColor2: 'rgba(38, 166, 154, 0.05)',
    topLineColor: 'rgba(38, 166, 154, 1)',
    bottomFillColor1: 'rgba(239, 83, 80, 0.05)',
    bottomFillColor2: 'rgba(239, 83, 80, 0.28)',
    bottomLineColor: 'rgba(239, 83, 80, 1)',
    lineWidth: 3,
    lineStyle: 0 /* LineStyle.Solid */,
    lineType: 0 /* LineType.Simple */,
    lineVisible: true,
    crosshairMarkerVisible: true,
    crosshairMarkerRadius: 4,
    crosshairMarkerBorderColor: '',
    crosshairMarkerBorderWidth: 2,
    crosshairMarkerBackgroundColor: '',
    lastPriceAnimation: 0 /* LastPriceAnimationMode.Disabled */,
    pointMarkersVisible: false,
};
const createPaneView = (series, model) => new SeriesBaselinePaneView(series, model);
export const createSeries = () => {
    const definition = {
        type: 'Baseline',
        isBuiltIn: true,
        defaultOptions: baselineStyleDefaults,
        /**
         * @internal
         */
        createPaneView: createPaneView,
    };
    return definition;
};
export const baselineSeries = createSeries();
