import { SeriesLinePaneView } from './line-pane-view';
export const lineStyleDefaults = {
    color: '#2196f3',
    lineStyle: 0 /* LineStyle.Solid */,
    lineWidth: 3,
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
const createPaneView = (series, model) => new SeriesLinePaneView(series, model);
export const createLineSeries = () => {
    const definition = {
        type: 'Line',
        isBuiltIn: true,
        defaultOptions: lineStyleDefaults,
        /**
         * @internal
         */
        createPaneView: createPaneView,
    };
    return definition;
};
export const lineSeries = createLineSeries();
