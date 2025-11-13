// 每个ChartWidget实例的鼠标事件
export class ChartWidgetMouseHandler {
    _chartWidget;
    _element;
    constructor(chartWidget) {
        this._chartWidget = chartWidget;
        this._element = chartWidget.getNode()
        this.initMouseEvent();
        
    }
    initMouseEvent() {
        this.onWheelBound = this.onWheel.bind(this)
        this._element.addEventListener('wheel', this.onWheelBound, { passive: false })
    }
    onWheel(e) {
        this._chartWidget.timeScale().wheel(e)
    }
    destroyed() {
        this._element.removeEventListener('wheel', this.onWheelBound)
    }
}