import { SeriesHistogramPaneView } from './histogram-pane-view';
export const histogramStyleDefaults = {
    color: '#26a69a',
    base: 0,
};
const createPaneView = (series, model) => new SeriesHistogramPaneView(series, model);
export const createSeries = () => {
    const definition = {
        type: 'Histogram',
        isBuiltIn: true,
        defaultOptions: histogramStyleDefaults,
        /**
         * @internal
         */
        createPaneView: createPaneView,
    };
    return definition;
};
export const histogramSeries = createSeries();
