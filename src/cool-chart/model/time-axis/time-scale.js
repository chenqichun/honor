import { isChromiumBased, isWindows } from '../../types/browsers'
import { merge } from '../../types/common'
const windowsChrome = isChromiumBased() && isWindows();
/**
 * options
 * {
    "rightOffset": 0, // 距离右侧偏移，柱子根数为单位
    "barSpacing": 6,
    "minBarSpacing": 0.5,
    "maxBarSpacing": 0,
    "fixLeftEdge": false, // 禁止往左边拖动
    "fixRightEdge": false, // 禁止往右边拖动
    "lockVisibleTimeRangeOnResize": false,
    "rightBarStaysOnScroll": false, 禁止往右边缩放
    "borderVisible": true,
    "borderColor": "#2B2B43",
    "visible": true,
    "timeVisible": false,
    "secondsVisible": true,
    "shiftVisibleRangeOnNewBar": true,
    "allowShiftVisibleRangeOnWhitespaceReplacement": false,
    "ticksVisible": false,
    "uniformDistribution": false,
    "minimumHeight": 0,
    "allowBoldLabels": true,
    "ignoreWhitespaceIndices": false,
    "rightOffsetPixels": 80  // 距离右侧偏移，px为单位
}
 */
export class TimeScale {
    _options = {}
    _chartWidget;
    _element;
    _width; // 时间轴的宽度,不包含左右的宽度
    _rightOffset = 0 // 距离右侧的距离,以柱子根数为单位,不是像素为单位
    _barSpacing = 6 // 整根柱子的宽度，包含留白
    constructor(chartWidget,options = {}) {
        this._chartWidget = chartWidget;
        this._element = this._chartWidget.getNode()
        this._dataLayer = this._chartWidget.dataLayer();
        this._rightOffset = options.rightOffset || this._rightOffset
        this._barSpacing = options.barSpacing || this._barSpacing
        merge(this._options, options)
    }
    // 鼠标滚动事件
    wheel(event) {
       // if (this.isEmpty() || event.deltaY === 0) return;
        const speed = this.adjustmentWheelSpeed(event)
        const deltaX = speed * event.deltaX / 100;
        const deltaY = speed * event.deltaY / 100;
        if (event.cancelable) event.preventDefault();
        if (deltaY !== 0) {
            const zoomScale = Math.sign(deltaY) * Math.min(1, Math.abs(deltaY));
            // this._width是时间轴的宽度，而事件是绑定在ChartWidget上，所以需要现在最大最小范围
            let scrollPosition = event.clientX - this._element.getBoundingClientRect().left;
            scrollPosition = Math.max(1, Math.min(scrollPosition, this._width))
            this.zoom(scrollPosition, zoomScale)
        }
    }
    zoom(x, scale) {
        x = Math.max(1, Math.min(x, this._width));
        const barSpacing = this._barSpacing;
        const newBarSpacing = barSpacing + scale * (barSpacing / 10);
        this.setBarSpacing(newBarSpacing);
        if (!this._options.rightBarStaysOnScroll) {
            // 缩放的时候禁止往右边缩放
            // floatIndexAtZoomPoint - this.coordinateToFloatIndex(zoomPoint)) 可不为0， 因为上面的setBarSpacing()
            this.setRightOffset(this.rightOffset() + (floatIndexAtZoomPoint - this.coordinateToFloatIndex(zoomPoint)));
        }
    }
    // 修改柱子宽度
    setBarSpacing(newBarSpacing) {
        const oldBarSpacing = this._barSpacing;
        this._setBarSpacing(newBarSpacing);
    }
    // 设置偏移量
    setRightOffset(offset) {
        this._visibleRangeInvalidated = true;
        this._rightOffset = offset;
        this._correctOffset();
    }
    _correctOffset() {}

    // 调整滚轮速率
    adjustmentWheelSpeed(event) {
        switch (event.deltaMode) {
            case event.DOM_DELTA_PAGE:
                return 120;
            case event.DOM_DELTA_LINE:
                return 32;
        }
        if (!windowsChrome) {
            return 1;
        }
        return (1 / window.devicePixelRatio);
    }
    // 鼠标所在的位置到右侧的偏差多少根柱子宽度
    rightOffsetForCoordinate(x) {
        return (this._width - 1 - x) / this._barSpacing;
    }
    // 鼠标所在的位置是处于k线数据的什么索引，浮动
    coordinateToFloatIndex(x){
        const deltaFromRight = this.rightOffsetForCoordinate(x);
        const baseIndex = this.baseIndex();
        const index = baseIndex + this._rightOffset - deltaFromRight
        return Math.round(index * 1000000) / 1000000
    }
    setWidth(width) {
        if (this._width === width) return;
        this._width = width;
    }
    dataLayer(){
        return this._chartWidget.dataLayer()
    }
    baseIndex() {
        return this.dataLayer().baseIndex()
    }
    isEmpty() {
        return !this.dataLayer().hasData() || this._width === 0
    }
    rightOffsetPx() {
        return this._rightOffset * this._barSpacing
    }
    barSpacing() {
        return this._barSpacing
    }
    rightOffset() {
        return this._rightOffset;
    }
}