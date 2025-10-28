import { SeriesBarsPaneView } from './bars-pane-view';
export const barStyleDefaults = {
    upColor: '#26a69a',
    downColor: '#ef5350',
    openVisible: true,
    thinBars: true,
};
const createPaneView = (series, model) => new SeriesBarsPaneView(series, model);
export const createSeries = () => {
    const definition = {
        type: 'Bar',
        isBuiltIn: true,
        defaultOptions: barStyleDefaults,
        /**
         * @internal
         */
        createPaneView: createPaneView,
    };
    return definition;
};
export const barSeries = createSeries();
