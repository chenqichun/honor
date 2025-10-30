
/*
创建每个小面板，如 k线面版 | 附图指标面版 | 时间轴
每个PanelWidget都会包含左，中，右边三部分
*/
import {
    createEle,
    setEleStyle
} from '../types/dom'
import {getRandomStr} from '../types/common'

import { CanvasWidget } from './canvas-widget'

export class PanelWidget {
    _ele; // PanelWidget本身元素
    _mainArea = new Map();
    _leftPriceAxis = new Map();
    _rightPriceAxis = new Map();
    _options;
    _name;
    _chartWidget; // ChartWidget控件
    constructor(chartWidget,options) {
        this._chartWidget = chartWidget;
        this._options = options;
        this._name = options.name || getRandomStr('panelWidget')
        this.createElement();
    }
    createElement() {
        this._ele = createEle('div', 'panel-flex-row');
        setEleStyle(this._ele, {display: 'flex'});
        // 左边价格y轴
        const leftAreaEl = createEle('div', 'price-axis-container');
        this._leftPriceAxis.set('el',leftAreaEl)
        this._ele.appendChild(leftAreaEl);
        // 创建中间区域
        const mainEl = createEle('div', 'main-canvas-gui');
        const main_cw = new CanvasWidget({
            width: this._options.width - 50,
            height: this._options.height
        })
        mainEl.appendChild(main_cw.getNode())
        this._mainArea.set('el',mainEl)
        this._mainArea.set(main_cw.getName(),main_cw)
        this._ele.appendChild(mainEl);
         // 右边价格y轴
        const rightAreaEl = createEle('div', 'price-axis-container');
        const right_cw = new CanvasWidget({
            width: 50,
            height: this._options.height
        })
        rightAreaEl.appendChild(right_cw.getNode())
        this._rightPriceAxis.set('el',rightAreaEl)
        this._rightPriceAxis.set(right_cw.getName(),right_cw)
        this._ele.appendChild(rightAreaEl);

        this._chartWidget.addChildToConentWrap(this._ele)
    }

}