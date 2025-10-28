
import {
  assert,
  isString
} from './utils/common'
import { TimeAxisBehavior } from './time-axis-behavior';

import { ChartApi } from '../api/chart-api';
export function fetchHtmlElement(container) {
    if (isString(container)) {
        const element = document.getElementById(container);
        assert(element !== null, `Cannot find element in DOM with id=${container}`);
        return element;
    }
    return container;
}

export function createChartEx(container, horzScaleBehavior, options) {
    const htmlElement = fetchHtmlElement(container);
    const res = new ChartApi(htmlElement, horzScaleBehavior, options);
    horzScaleBehavior.setOptions(res.options());
    return res;
}

export function createChart(container, options) {
    return createChartEx(container, new TimeAxisBehavior(), TimeAxisBehavior.applyDefaults(options));
}

export function defaultHorzScaleBehavior() {
    return TimeAxisBehavior;
}
