import { SeriesAreaPaneView } from './area-pane-view';
export const areaStyleDefaults = {
    topColor: 'rgba( 46, 220, 135, 0.4)',
    bottomColor: 'rgba( 40, 221, 100, 0)',
    invertFilledArea: false,
    relativeGradient: false,
    lineColor: '#33D778',
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
const createPaneView = (series, model) => new SeriesAreaPaneView(series, model);
export const createSeries = () => {
    const definition = {
        type: 'Area',
        isBuiltIn: true,
        defaultOptions: areaStyleDefaults,
        /**
         * @internal
         */
        createPaneView: createPaneView,
    };
    return definition;
};
export const areaSeries = createSeries();
