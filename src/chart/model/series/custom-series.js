import { ensure } from '../../helpers/assertions';
import { SeriesCustomPaneView } from './custom-pane-view';
export const customStyleDefaults = {
    color: '#2196f3',
};
const createPaneView = (series, model, customPaneView) => {
    const paneView = ensure(customPaneView);
    return new SeriesCustomPaneView(series, model, paneView);
};
export const createCustomSeriesDefinition = (paneView) => {
    const definition = {
        type: 'Custom',
        isBuiltIn: false,
        defaultOptions: { ...customStyleDefaults, ...paneView.defaultOptions() },
        /**
         * @internal
         */
        createPaneView: createPaneView,
        customPaneView: paneView,
    };
    return definition;
};
