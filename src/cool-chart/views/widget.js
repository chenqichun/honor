import {
    isString,
    InputError,
    isHtmlElement
} from '../types/check'

import {
    createEle,
    setEleStyle
} from '../types/dom'

import {
    InputError
} from '../types/common'
import {
    ObserveResizeWH
} from '../model/observeResize'


export function getTargetHtmlElement(container) {
    if (isString(container)) {
        container = document.querySelector(container)
    }
    if (!isHtmlElement(container)) {
        InputError(`container is not a HTMLElement:${container}`);
    }
    return container
}

// 创建最外层元素
export class ChartContainer {
    _outSideContainer; // 外层容器
    _container; // 图表面版主区域
    _containerClassName = 'cool-chart-layout-container';
    _observeResize;
    constructor(container) {
       this._outSideContainer = getTargetHtmlElement(container); 
       this.createWidget();
    }
    createWidget() {
        this._container = setEleStyle(
            createEle('div',this._containerClassName),
            {
            position:'relative',
            width: '100%',
            height: '100%'
            }
        );
    }
    observeResize(callback) {
        this._observeResize = new ObserveResizeWH(this._container, {callback})
    }
    destroyed() {
        this._observeResize?.destroyed();
        this._observeResize = null;
    }
}