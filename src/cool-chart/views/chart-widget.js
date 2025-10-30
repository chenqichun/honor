/**
 * ChartWidget 是每个品种面版，包含k线，指标，绘图，时间轴，价格轴，相关提示和操作等等
 * 可以理解为每个独立的品种图表
 */

import {
    getPrefixClass,
} from '../types/common'
import {
    createEle,
    setEleStyle,
    widgetDefaultOption,
    setEleStyleByKey
} from '../types/dom'
import {isNumber, isExist} from '../types/check'
import {PanelBottomControl} from './panel-bottom-control'
import {PanelTooltip} from './panel-toolTip'
import {PanelWidget} from './panel-widget'

export class ChartWidget {
    _allChartContainer; // 所有图表区域
    _widget_container; // 每个品种图表最外层元素
    _widget_panelwrap; // 用来装每个panelWidget
    _options;
    _name; // 每个面版唯一的名字
    _widget_container_className = 'chart-widget-container'
    _widget_panelwrap_className = 'panel-content-wrap'
    _panelBottomControl;
    _panelWidgetList = [];
    _size =  { left: 0, top: 0, width: 0, height: 0}; // 记录尺寸
    constructor(allChartContainer, options = {...widgetDefaultOption}) {
        this._allChartContainer = allChartContainer;
        this._options = options;
        this._name = options.name
        this.createWidget();
        // 创建底部控制按钮
        this._panelBottomControl = new PanelBottomControl(this)
        // 创建面版内部提示
        this._panelTooltip = new PanelTooltip(this)
    }
    // 创建节点
    createWidget() {
        // 取出最外层的尺寸
        const { clientWidth:allWidth,  clientHeight: allHeight} = this._allChartContainer;
        const {left,top,width,height} = this._options || {};
        this._widget_container = createEle('div',this._widget_container_className);
        this._widget_panelwrap = createEle('div',this._widget_panelwrap_className);
        this._widget_container.appendChild(this._widget_panelwrap);
        this._allChartContainer.appendChild(this._widget_container);
        setEleStyle(this._widget_container,{position: 'absolute'})

        this.initPanelWidget();

        this.updateWidgetSize({ left: left || 0,top: top || 0, width: width || allWidth, height: height || allHeight });

    }
    // 初始化panelWidget,创建子面板
    initPanelWidget() {
        const { clientWidth, clientHeight} = this._allChartContainer;
        let {width,height, panelWidgetInfoList} = this._options || {};
        const allWidth = width || clientWidth;
        const allHeight = height || clientHeight;
        // 如果存在缓存数据
        if (panelWidgetInfoList?.length) {
            const oleAllHeiht = panelWidgetInfoList.reduce((a,b) => a + b.height, 0);
            panelWidgetInfoList.forEach(item => {
                const pw = new PanelWidget(this, {
                    name: item.name,
                    width: parseInt(allWidth),
                    height: parseInt(allHeight * item.height / oleAllHeiht),
                })
                this._panelWidgetList.push(pw)
            })
            
        } else {
            const pw = new PanelWidget(this,{
                    width: parseInt(allWidth),
                    height: parseInt(allHeight),
                })
            this._panelWidgetList.push(pw)
        }
    }
    // 添加到contentWrap容器下
    addChildToConentWrap(ele) {
        this._widget_panelwrap.appendChild(ele)
    }
    // 添加到container容器下
    addChildEle(ele) {
        this._widget_container.appendChild(ele)
    }
    // 更新尺寸
    updateWidgetSize(options = {}) {
        Object.entries(options).forEach(([key,value]) => {
            if (isExist(value) && key in this._size) {
                setEleStyleByKey(this._widget_container, key,  `${parseInt(value)}px`);
                if (['width','height'].includes(key)) {
                    setEleStyleByKey(this._widget_panelwrap, key,  `${parseInt(value)}px`);
                }
                this._size[key] = parseInt(value);
            } 
        })
    }
    // 激活
    toActive() {}
}