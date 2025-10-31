

import {
    createEle,
} from '../types/dom'


export class AddChartChildBase {
    _className;
    _chartWidget; // 所属品种图表面版
    _ele;
    constructor(chartWidget, options) {
        this._chartWidget = chartWidget;
        this._className = options.className
        this.createElement();
    }
    createElement() {
        this._ele = createEle('div', this._className);
        this._chartWidget.addChildEle(this._ele)
    }
    destroyed() {
        this._ele.remove()
    }

}