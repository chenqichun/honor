
import { CanvasWidget } from './canvas-widget'
import { createEle, setEleStyle } from '../types/dom'
import { BaseWidget } from './baseWidget'
import { isNumber } from '../types/check'
import { PriceAxisHandler } from '../handler/price-axis-handler'
const childItemProp = {
    widget: 1,
    handler: 2
}
export class PriceAxisWidget extends BaseWidget {
    _options = {
        childDefaultWidth: 50,
        height: 0,
        childInfoList: [] // 存在子信息列表才创建CanvasWidget
    }
    _ele;
    _childWidgetList = []; // 子widget列表
    

    constructor(options) {
        super(options)
        this._options = {...this._options, ...options}
        this.createElement();
    }

    createElement() {
        this._ele  = createEle('div', 'price-axis-container', {position:'relative', height:this._options.height + 'px'});
        this._options.childInfoList.forEach((childInfo) => {

            const {childDefaultWidth:width, height, minValue, maxValue} = this._options
            const childWMap = new Map();
            const widget = new CanvasWidget(this, { 
                className:'price-axis', 
                height, 
                width
            });
            const handler = new PriceAxisHandler(widget, {
                height, 
                width,
            })
            childWMap.set(childItemProp.widget, widget)
            childWMap.set(childItemProp.handler, handler) 

            this._childWidgetList.push(childWMap)
            this._ele.appendChild(widget.getNode())
        });
        
        this.updateSize();
    }
    setSize(height) {
        if (isNumber(height)) this._options.height = height;
        this.updateSize();
    }
    
    updateSize() {
        let allWidth = 0, left = 0, height = this._options.height;
        this._childWidgetList.forEach(childMap => {
            const widget = childMap.get(childItemProp.widget)
            const handler = childMap.get(childItemProp.handler)
            const heightHasChange = widget.getSize().height === height
            allWidth += widget.getSize().width;
            // 更新child的left值
            widget.setSize(null,height,left)
            left += allWidth
            if (heightHasChange) handler.setPriceScaleHeight(height);
        });
        setEleStyle(this._ele, {width: allWidth + 'px', height: height + 'px'})
    }
    getWidth() {
        return this._childWidgetList.reduce((a,b) => a + b.getSize().width, 0)
    }
    getSize() {
        return {
          width: this.getWidth(),
          height: this._options.height
        }
    }
    destroyed() {
        this._childWidgetList.forEach(child => {
            child.forEach(e => e.destroyed?.())
            child.clear();
        })
        this._childWidgetList = [];
    }
}