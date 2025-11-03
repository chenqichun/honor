/**
 * 每个图表panelWidget右上角的的工具，如向上，向下，删除
 */
import { createEle } from '../types/dom'

export class PanelControl {
    _options;
    _panelWidget; // 当前legend所属的panelWidget
    _ele;
    _up;
    _down;
    constructor(panelWidget, options) {
        this._options = options
        this._panelWidget = panelWidget
        this.createElement();
    }
    createElement() {
        this._ele = createEle('div', 'panel-widget-control')
        this._up = createEle('div', 'panel-control-btn panel-control-up')
        this._down = createEle('div', 'panel-control-btn panel-control-down')
        this._ele.appendChild(this._up)
        this._ele.appendChild(this._down)
    }
    getNode() {
        return this._ele
    }
    destroyed() {}
}