// y轴鼠标事件绑定
import { PriceScale } from '../model/price-axis/price-scale'
export class PriceAxisHandler {
    _options;
    _mouseDownStatus = false;
    _lastThrottleTime = Date.now();
    _priceScale; // PriceScale实例
    _canvasWidget;
    constructor(canvasWidget,options) {
        this._canvasWidget = canvasWidget;
        this._options = options || {}
        this._priceScale = new PriceScale(options)
        this.init()
    }

    init() {
        this._canvasWidget.coverCanvas().addEventListener('mousedown', this.mousedown) 
    }

    getPriceScale() {
        return this._priceScale
    }
    setPriceScaleHeight(height) {
        this._priceScale.setHeight(height)
    }

    // 这种写法是无需考虑bind绑定this和移除找不到对应方法的问题
    mousedown = (e) => {
        this._mouseDownStatus = true;
        this._priceScale.startScale(e.clientY)
        document.addEventListener('mousemove', this.mousemove)
        document.addEventListener('mouseup', this.mouseup)
    }
    mousemove = e => {
        const duration = 10
        if (Date.now() - this._lastThrottleTime > duration) {
            this._lastThrottleTime = Date.now()
            this._priceScale.scaleTo(e.clientY)
        }
    }
    mouseup = () => {
        this._mouseDownStatus = false;
        this._priceScale.endScale();
        document.removeEventListener('mousemove', this.mousemove)
        document.removeEventListener('mouseup', this.mouseup)
    }

    destroyed() {
        this._targetEl.removeEventListener('mousedown', this.mousedown)
        document.removeEventListener('mousemove', this.mousemove)
        document.removeEventListener('mouseup', this.mouseup)
    }

}