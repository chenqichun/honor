
import { CanvasWidget } from './canvas-widget'
import { createEle, setEleStyle,  } from '../types/dom'
import { ratioPx, getDevicePixelRatio, clearCanvas } from '../render/canvas'
import { clone} from '../types/common'
import { BaseWidget } from './baseWidget'
import { isNumber } from '../types/check'
import { PriceAxisHandler } from '../handler/price-axis-handler'

const childOptions = {
    tickLineColor: 'red',
    tickTextColor: '#000',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif",
    fontSize: 12,
    tickWidth: 6,
    tickTextDiff: 4
}

class PriceAxisChild {     
    _options = {
        width: 50,
        minValue: 0,
        maxValue: 0,
        ...childOptions
    };
    _pixelRatio = getDevicePixelRatio()
    _widget;
    _handler;
    constructor(options) {
        this._options = Object.assign(this._options, clone(options))
        this.create();
    }
    create() {
        const {width, height, minValue, maxValue, fontSize, fontFamily} = this._options
        this._widget = new CanvasWidget(this, { 
            className:'price-axis', 
            height, 
            width
        });
        this._handler = new PriceAxisHandler(this, {
            height, 
            width,
            maxValue,
            minValue,
            fontFamily,
            fontSize
        })
        this.render();
    }
    update(options = {}) {
        const {left = 0, height, width} = options
        const heightHasChange = this.height() === height
        // 更新child的left值
        this.widget().setSize(width,height,left)
        if (heightHasChange) this.handler().setPriceScaleHeight(height);
        this.render();
    }
    destroyed() {
        this.widget().destroyed();
        this.handler().destroyed();
    }
    render() {
        if (!this.priceScale()) return;
        const {tickLineColor, tickWidth, fontSize, fontFamily, tickTextDiff} = this._options
      
        const marks = this.priceScale().marks()
        const canvas = this.widget().drawCanvas();
        const ctx = this.widget().drawCtx()
        const lineWidth = Math.max(1,Math.floor(this._pixelRatio))
        ctx.strokeStyle = tickLineColor
        ctx.lineWidth = lineWidth;
        ctx.textBaseline = 'middle'
        ctx.font = `${fontSize} ${fontFamily}`
        
        clearCanvas(canvas,ctx);
        ctx.beginPath();
        ctx.moveTo(0, 0)
        ctx.lineTo(0, ratioPx(this.height()))
        marks.forEach(e => {
            ctx.moveTo(0, ratioPx(e.pixel))
            ctx.lineTo(ratioPx(tickWidth), ratioPx(e.pixel))
        })
        ctx.stroke();
        ctx.beginPath();
        marks.forEach(e => {
            ctx.fillText(e.priceTickLabel, ratioPx(tickWidth + tickTextDiff), ratioPx(e.pixel))
        })
    }
    getNode() {
        return this.widget().getNode()
    }
    width() {
        return this.widget().width()
    }
    height() {
        return this.widget().height()
    }
    widget() {
        return this._widget
    }
    priceScale() {
        return this._handler?.getPriceScale()
    }
    handler() {
        return this._handler
    }
}
export class PriceAxisWidget extends BaseWidget {
    _options = {
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
        const height =  this._options.height
        this._ele  = createEle('div', 'price-axis-container', {
            position:'relative',
            height: height + 'px'
        });
        this._options.childInfoList.forEach(info=> {
            const child = new PriceAxisChild({...info,height})
            this._childWidgetList.push(child)
            this._ele.appendChild(child.getNode())
        });
        
        this.updateSize();
    }
    setSize(height) {
        if (isNumber(height)) this._options.height = height;
        this.updateSize();
    }
    
    updateSize() {
        let allWidth = 0, left = 0, height = this._options.height;
        this._childWidgetList.forEach(child => {
            allWidth += child.width();
            child.update({left,height})
            left += allWidth
        });
  
        setEleStyle(this._ele, {width: allWidth + 'px', height: height + 'px'})
    }

    getWidth() {
        return this._childWidgetList.reduce((a,b) => a + b.width(), 0)
    }
    getSize() {
        return {
          width: this.getWidth(),
          height: this._options.height
        }
    }
    destroyed() {
        this._childWidgetList.forEach(child => child.destroyed())
        this._childWidgetList = [];
    }
}