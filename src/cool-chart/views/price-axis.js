
import {
    CanvasWidget
} from './canvas-widget'
import { createEle, setEleStyle } from '../types/dom'
import { BaseWidget } from './baseWidget'
import { isNumber } from '../types/check'
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
           const childW = new CanvasWidget(this, { 
            className:'price-axis', 
             height: this._options.height, 
             width: this._options.childDefaultWidth
            });
           this._childWidgetList.push(childW)
           this._ele.appendChild(childW.getNode())
        });
        
        this.updateSize();
    }
    setSize(height) {
        if (isNumber(height)) this._options.height = height;
        this.updateSize();
    }
    
    updateSize() {
        let allWidth = 0, left = 0;
        this._childWidgetList.forEach(childWg => {
            allWidth += childWg.getSize().width;
            // 更新child的left值
            childWg.setSize(null,this._options.height,left)
            left += allWidth
        });
        setEleStyle(this._ele, {width: allWidth + 'px', height: this._options.height + 'px'})
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
}