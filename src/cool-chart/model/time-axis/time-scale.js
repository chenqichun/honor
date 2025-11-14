import { isChromiumBased, isWindows } from '../../types/browsers'
import { merge, clamp, isInteger } from '../../types/common'
const windowsChrome = isChromiumBased() && isWindows();
/**
 * options
 * {
    "rightOffset": 0, // 距离右侧偏移，柱子根数为单位
    "barSpacing": 6,
    "minBarSpacing": 0.5, // 最小柱子宽度
    "maxBarSpacing": 0, // 最大柱子宽度，实际上0的时候是默认值是零，那么就用时间轴宽度计算，否则就用传入的计算
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
    _options = {
        rightOffset: 0, // 距离右侧偏移，柱子根数为单位
        barSpacing: 6, // 柱子宽度，包含留白
        minBarSpacing: 0.5,
        maxBarSpacing: 0,
        fixLeftEdge: false, // 禁止往左边拖动
        fixRightEdge: false, // 禁止往右边拖动
        rightBarStaysOnScroll: false,
        lockVisibleTimeRangeOnResize: false
    }
    _chartWidget;
    _element;
    _width; // 时间轴的宽度,不包含左右的宽度
    _rightOffset = 0 // 距离右侧的距离,以柱子根数为单位,不是像素为单位
    _barSpacing = 6 // 整根柱子的宽度，包含留白
    _minVisibleBarsCount = 2; // 最少显示k线的数量
    _leftFloatIndex = 0; // 可视区域左边索引，浮点
    _rightFloatIndex = 0; // 可视区域右边索引，浮点
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
    // 修改柱子宽度并且对rightOffsetPixels处理
    setBarSpacing(newBarSpacing) {
        const oldBarSpacing = this._barSpacing;
        this._setBarSpacing(newBarSpacing);
        if (this._options.rightOffsetPixels !== undefined && oldBarSpacing !== 0) {
            // when in pixel mode, zooming should keep the pixel offset, so we need to
            // recalculate the bar offset.
            const newRightOffset = this._rightOffset * oldBarSpacing / this._barSpacing;
            this._rightOffset = newRightOffset;
        }
    }
    // 正在修改柱子宽度的方法
    _setBarSpacing(newBarSpacing) {
        const oldBarSpacing = this._barSpacing;
        this._barSpacing = newBarSpacing;
        this.correctBarSpacing();
    }
    correctBarSpacing() {
        const barSpacing = clamp(this._barSpacing, this.minBarSpacing(), this.maxBarSpacing());
        if (this._barSpacing !== barSpacing) {
            this._barSpacing = barSpacing;
        }
        this.updateVisibleRange();
    }
    minBarSpacing() {
        if (this._options.fixLeftEdge && this._options.fixRightEdge && this.dataLength() !== 0) {
            return this._width / this.dataLength();
        }
        return this._options.minBarSpacing;
    }
    maxBarSpacing() {
        return this._options.maxBarSpacing > 0 ? this._options.maxBarSpacing : this._width * 0.5
    }
    // 设置偏移量
    setRightOffset(offset) {
        this._rightOffset = offset;
        this.correctOffset();
    }
    // 校正右侧偏移量，避免出现超出最大，最小范围
    correctOffset() {
        const minRightOffset = this.minRightOffset();
        if (minRightOffset !== null && this._rightOffset < minRightOffset) {
            this._rightOffset = minRightOffset;
        }

        const maxRightOffset = this.maxRightOffset();
        if (this._rightOffset > maxRightOffset) {
            this._rightOffset = maxRightOffset;
        }
        this.updateVisibleRange();
    }

    minRightOffset() {
        if (this.dataLength() === 0) {
            return null;
        }
        const barsEstimation = this._options.fixLeftEdge
            ? this._width / this._barSpacing
            : Math.min(this._minVisibleBarsCount, this.dataLength());
        return  barsEstimation - this.dataLength();
    }
    maxRightOffset() {
        return this._options.fixRightEdge
            ? 0
            : (this._width / this._barSpacing) - Math.min(this._minVisibleBarsCount, this.dataLength());
    }


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
        return (this.calcWidth() - x) / this._barSpacing;
    }
    // 任意x坐标换做索引，浮动
    coordinateToFloatIndex(x){
        const deltaFromRight = this.rightOffsetForCoordinate(x);
        const baseIndex = this.baseIndex();
        const index = baseIndex + this._rightOffset - deltaFromRight
        return Math.round(index * 1000000) / 1000000
    }
    // 任意x坐标处换做索引,整数，(给外部绘图等的转换调用)
    /**
     * 
     * @param {*} x 任意x坐标
     * @param {*} isLimitWidthData // 是否限制于真实数据，如果限制，那么最小的索引就是0， 最大的索引就是数据的长度减去1
     * @return 整数索引
     */
    coordinateToIndex(x, isLimitWidthData = false) {
        const index = Math.ceil(this.coordinateToFloatIndex(x))
        if (!isLimitWidthData) return index
        const firstIndex = this.firstIndex()
        const lastIndex = this.lastIndex();
        return index < firstIndex ? firstIndex : (index > lastIndex ? lastIndex : index)
    }
    // 通过索引找出x轴坐标
    indexToCoordinate(index) {
        if (this.isEmpty() || !isInteger(index)) return 0;
        const deltaFromRight = this._rightFloatIndex - index
        // 因为我们索引换算的坐标都是在柱子的中间线位置，所以加0.5
        const coordinate = this.calcWidth() - (deltaFromRight + 0.5) * this._barSpacing
        return coordinate
    }
    // 通过时间查找最近的索引
    timeToIndex(time, findNearest) {
        return this.dataLayer().timeToIndex(time, findNearest)
    }
    // 通过索引求出对应的k线时间
    indexTotime(index) {
        return this.dataLayer().indexTotime(index)
    }
    // 通过索引获取k线数据
    indexToPoint(index) {
        return this.dataLayer().indexToPoint(index)
    }
    // 更新可视范围
    updateVisibleRange() {
        if (this.isEmpty()) return;
        const baseIndex = this.baseIndex();
        const newBarsLength = this._width / this._barSpacing;
        const rightIndex = baseIndex + this._rightOffset;
        const leftIndex = rightIndex - newBarsLength + 1
        this._leftFloatIndex = leftIndex;
        this._rightFloatIndex = rightIndex
    }
    // 可视区域逻辑范围k线索引,就是算出啥就是啥，带小数点(from,to值可以不在k线数据里)
    visibleLogicalRange() {
        this.updateVisibleRange();
        return {
            from: this._leftFloatIndex,
            to: this._rightFloatIndex
        }
    }
    // 可视区域严格范围k线索引，整数，对左右进行取值,一般提供给外部使用(from,to值可以不在k线数据里)
    visibleStrictRange() {
        this.updateVisibleRange();
        return {
            from: Math.floor(this._leftFloatIndex),
            to: Math.ceil(this._rightFloatIndex)
        }
    }
    // 可视区域时间范围，只包含已经存在的k线时间内
    visibleTimeRange() {
        const { from, to } = this.visibleStrictRange();
        const firstIndex = this.firstIndex()
        const lastIndex = this.lastIndex();
        const fromIndex = Math.max(from, firstIndex)
        const toIndex = Math.min(lastIndex, to)
        return {
            fromIndex,
            toIndex,
            formData: this.indexToPoint(fromIndex),
            toData: this.indexToPoint(toIndex)
        }
    }
    // 可视范围的k线数据
    visibleKLineDataRange() {
        const { fromIndex, toIndex } = this.visibleTimeRange();
        const dataList = this.dataLayer().getData()
        return  dataList.slice(fromIndex, toIndex + 1)
    }

    setWidth(newWidth) {
        if (this._width === newWidth || newWidth <= 0) return;
        const oleWidth = this._width
        this._width = newWidth;
        const previousRange = this.visibleLogicalRange()
        if (this._options.lockVisibleTimeRangeOnResize && oleWidth !== 0) {
            const newBarSpacing = this._barSpacing * newWidth / oleWidth
            this._barSpacing = newBarSpacing
        }
        if (this._options.fixLeftEdge) {
            if (previousRange.from <= 0) {
                const delta = oleWidth - newWidth
                this._rightOffset -= Math.round(delta / this._barSpacing) + 1
            }
        }
        this.correctBarSpacing();
        this.correctOffset();
    }
    dataLayer(){
        return this._chartWidget.dataLayer()
    }
    baseIndex() {
        return this.dataLength() - 1;
    }
    firstIndex() {
        return this.dataLength() === 0 ? null : 0
    }
    lastIndex() {
        const len = this.dataLength()
        return len === 0 ? null : len - 1;
    }
    dataLength() {
        return this.dataLayer().length()
    }
    isEmpty() {
        return !this.dataLayer().hasData() || this._width === 0
    }
    width() {
        return this._width
    }
    calcWidth() {
        return this._width - 1;
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