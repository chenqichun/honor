/**
 * 时间轴，每个品种图表chartWidget底部的时间轴
 */
import { CanvasWidget } from './canvas-widget'
import {
    createEle,
    setEleStyle
} from '../types/dom'
import { isNumber } from '../types/check'
import { BaseWidget } from './baseWidget'
export class TimeAxisWidget extends BaseWidget {
    _options = {
        width: 0,
        height: 30,
        leftWidth: 0,
        rightWidth: 0
    };
    _chartWidget;
    _ele;
    _leftArea;
    _rightArea;
    _mainArea = new Map();

    
    constructor(chartWidget,options) {
        super(options)
        this._chartWidget = chartWidget;
        this._options = {...this._options, ...options} 
        this.createElement();
    }
    createElement() {
        const {width,height} = this._options
        this._ele = createEle('div', 'panel-time-container', {position:'absolute',left:0,bottom:0, width: '100%',height: height + 'px'});
        setEleStyle(this._ele, {display: 'flex'});
        // 左边区域
        this._leftArea = createEle('div', 'price-axis-container', {position:'relative',minWidth: 0, width: 0});
        // 中间区域
        const mainEl = createEle('div', 'time-axis', {position:'relative'})
        this._mainArea.set('el', mainEl)
        this._mainArea.set('wg', new CanvasWidget(this, {height: this._options.height}))
        mainEl.appendChild(this._mainArea.get('wg').getNode())
        // 右边区域
        this._rightArea = createEle('div', 'price-axis-container', {position:'relative', minWidth: 0, width: 0});

        this._ele.appendChild(this._leftArea)
        this._ele.appendChild(mainEl)
        this._ele.appendChild(this._rightArea)

        this._chartWidget.addChildToConentWrap(this._ele)
    }

    // 更新左，中，右的尺寸和canvas的width,height
    setSize(width,leftWidth, rightWidth) {
        const width_change = isNumber(width) && width != this._options.width;
        const leftWidth_change = isNumber(leftWidth) && leftWidth != this._options.leftWidth;
        const rightWidth_change = isNumber(rightWidth) && rightWidth != this._options.rightWidth;
        const height = this._options.height;

        if (leftWidth_change) {
            const leftW = this._options.leftWidth = leftWidth
            setEleStyle(this._leftArea, {minWidth: leftW +'px', width: leftW + 'px', height: height + 'px'});
        }
        if (rightWidth_change) {
            const rightW = this._options.rightWidth = rightWidth
            setEleStyle(this._rightArea, {minWidth: rightW +'px', width: rightW + 'px', height: height + 'px'});
        }
        if (width_change || leftWidth_change || rightWidth_change) {
            this._options.width = width;
            const mainW = width - this._options.leftWidth - this._options.rightWidth
            setEleStyle(this._mainArea.get('el'), {width: mainW + 'px', height: height + 'px'});
            this._mainArea.get('wg').setSize(mainW, height)
        }
        
    }
    destroyed() {
        this._mainArea.clear();
        this._mainArea = null;
    }

}