import { SeriesCandlesticksPaneView } from './candlesticks-pane-view';
export const candlestickStyleDefaults = {
    upColor: '#26a69a',
    downColor: '#ef5350',
    wickVisible: true,
    borderVisible: true,
    borderColor: '#378658',
    borderUpColor: '#26a69a',
    borderDownColor: '#ef5350',
    wickColor: '#737375',
    wickUpColor: '#26a69a',
    wickDownColor: '#ef5350',
};
const createPaneView = (series, model) => new SeriesCandlesticksPaneView(series, model);
export const createSeries = () => {
    const definition = {
        type: 'Candlestick',
        isBuiltIn: true,
        defaultOptions: candlestickStyleDefaults,
        /**
         * @internal
         */
        createPaneView: createPaneView,
    };
    return definition;
};
export const candlestickSeries = createSeries();
