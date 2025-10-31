
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
import { PriceAxisWidget } from './price-axis'
import { BaseWidget } from './baseWidget'
// 现在不需要做正副面版的概念，不管是什么类型的指标，根据

// 面版配置参数
const defaultOptions = {
    name: '',
    width: 0,
    height: 0
}

export class PanelWidget extends BaseWidget {
    _ele; // PanelWidget本身元素
    _mainArea = new Map();
    _leftPriceAxis;
    _rightPriceAxis;
    _options;
    _chartWidget; // ChartWidget控件
    _indicatorMap = new Map(); // 存放指标的地方
    _drawObjMap = new Map(); // 存放其它绘图工具

    constructor(chartWidget,options) {
        super(options)
        this._chartWidget = chartWidget;
        this._options = {...defaultOptions, ...options};
        this._options.name = options.name || getRandomStr('panelWidget')
        this.createElement();
    }
    createElement() {
        this._ele = createEle('div', 'panel-flex-row');
        setEleStyle(this._ele, {display: 'flex'});
        // 左边价格y轴
        this._leftPriceAxis = new PriceAxisWidget({height: this._height})

        // 创建中间区域
        const mainEl = createEle('div', 'main-canvas-gui',{position: 'relative'});
        const main_cw = new CanvasWidget(this,{ height: this._height})
        mainEl.appendChild(main_cw.getNode())
        this._mainArea.set('el',mainEl)
        this._mainArea.set('wg', main_cw)

        // 右边价格y轴
        this._rightPriceAxis = new PriceAxisWidget({height: this._height, childInfoList:[{}]})
        
        this._ele.appendChild(this._leftPriceAxis.getNode());
        this._ele.appendChild(mainEl);
        this._ele.appendChild(this._rightPriceAxis.getNode());
        this._chartWidget.addChildToConentWrap(this._ele)

        this.setSize();
    }
    // 更新绘图区域尺寸
    setSize(width,height) {
        width = this._options.width = width || this._options.width
        height = this._options.height = height || this._options.height;
        const allLeftWidth = parseInt(this._leftPriceAxis.getWidth());
        const allRightWidth = parseInt(this._rightPriceAxis.getWidth());
        const mainWidth = width - allLeftWidth - allRightWidth;
       
        setEleStyle(this._mainArea.get('el'), {width: mainWidth + 'px', height: height + 'px'});
        this._mainArea.get('wg').setSize(mainWidth, height)
        // 更新左右价格尺寸
        this._leftPriceAxis.setSize(height)
        this._rightPriceAxis.setSize(height)
    }
    // 获取左右两边y轴各自的总宽度
    getPriceAxisWidth() {
        return {
            left: this._leftPriceAxis.getWidth(),
            right: this._rightPriceAxis.getWidth(),
        }
    }

    // 是不是独立面版
    isIndependent() {
        return this._options.layoutType == layoutTypes.independent
    }
    destroyed() {
        this._mainArea.clear();
        this._leftPriceAxis.clear();
        this._rightPriceAxis.clear();
        this._ele.remove();
        this._options = null;
    }

}