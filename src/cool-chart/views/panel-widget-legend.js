/**
 * 每个图表panelWidget左上角的的信息
 */
import { createEle } from '../types/dom'

export class PanelLegend {
    _options;
    _panelWidget; // 当前legend所属的panelWidget
    _ele;
    _legendMainEl; // 用于主品种的信息，如开高收低，快捷交易等
    _lengenSourcesEl; // 用于指标等
    constructor(panelWidget, options) {
        this._options = options
        this._panelWidget = panelWidget
        this.createElement();
    }
    createElement() {
        this._ele = createEle('div', 'panel-widget-legend')
        this._legendMainEl = createEle('div', 'legend-main')
        this._lengenSourcesEl = createEle('div', 'legend-sources')
        this._ele.appendChild(this._legendMainEl)
        this._ele.appendChild(this._lengenSourcesEl)
    }
    getNode() {
        return this._ele
    }
    destroyed() {}
}