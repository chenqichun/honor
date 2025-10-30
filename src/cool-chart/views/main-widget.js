import {
    isString,
    isHtmlElement,
} from '../types/check'

import {
    createEle,
    setEleStyle,
} from '../types/dom'

import {
    InputError,
} from '../types/common'

import {layoutTypes} from '../types/constant'
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
    _containerClassName = 'cool-chart-layout-container cool-chart';
    _observeResize;
    _$root; // 全局跟实例
    constructor(container, options) {
       this._$root = options._$root
       this._outSideContainer = getTargetHtmlElement(container); 
       this.createWidget();
    }
    getContainer() {
        return this._container
    }
    // 创建元素
    createWidget() {
        this._container = setEleStyle(
            createEle('div',this._containerClassName),
            {
            position:'relative',
            width: '100%',
            height: '100%'
            }
        );
       this._outSideContainer.innerHTML = '';
       this._outSideContainer.appendChild(this._container)
       this.setObserveResize();
    }
    // 宽高变化的时候查看品种图表是不是要变化
    resize() {
        const { clientWidth,  clientHeight} = this._container;
        const curLayoutType = this._$root.$chartLayoutHandler.getType();
        switch(curLayoutType) {
            case layoutTypes.full:
                const activeChart = this._$root.$chartWidgetHandler.getActiveChartWidget();
                activeChart?.updateWidgetSize?.({
                    width: clientWidth,
                    height: clientHeight
                })
            break;
        }
    }
    // 监听宽高变化
    setObserveResize() {
        this._observeResize = new ObserveResizeWH(this._container, {
            callback: () => this.resize()
        });
    }
    destroyed() {
        this._observeResize?.destroyed();
        this._observeResize = null;
    }

}

