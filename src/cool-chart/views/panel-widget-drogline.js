/**
 * 图表的拖拽线
 */
import { createEle } from '../types/dom'
export class DrogLine {
    _panelWidget;
    _ele;
    _chartWidget; // 所属品种图表面版
    _panelWidget; // 所属子面版
    _options;
    constructor(chartWidget, panelWidget, options) {
        this._chartWidget = chartWidget
        this._panelWidget = panelWidget
        this._options = options || {}
        this.createElement();
    }
    createElement() {
        const display = this._options.showGrogLine ? 'block' : 'none';
        this._ele = createEle('div', 'panel-widget-drogline', {display})
    }
    getNode() {
        return this._ele
    }
    destroyed() {}
}
