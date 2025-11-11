import { fromLog, logFormulaForPriceRange } from './price-scale-conversions'
import { PriceTickSpanCalculator } from './price-tickdiff-calculator'
import { isString } from '../../types/check'
export const scaleMode = {
    normal: 0, // 价格
    logarithmic: 1, // 对数
    rercentage: 2, // 百分比
    indexedTo100: 3, // 基数100
}

export const defaultOptions = {
    mode: scaleMode.normal, // 显示模式
    fixed: true, // y轴是否固定
    invertScale: false, // 是否翻转
    scaleMargins: {
        top: 0.2, // 上留白比率
        bottom: 0.1, // 下留白比率
    },
    height: 0,
    width: 0,
    maxValue: 0, // k线可视范围最大价格
    minValue: 0, // k线可视范围最小价格
    precision: 2, // 精度
    fontSize: 12,
}

export class PriceScale {
    _tickDensity = 2.5
    _options = {...defaultOptions}
    _marginAbove = 0 // 上留白像素
    _marginBelow = 0 // 下留白像素
    _logFormula = logFormulaForPriceRange(null);
    _calcMinValue = 0; // 最终计算后的y轴最小价格，如未翻转情况下就是canvas的物理高度像素所在的价格
    _calcMaxValue = 0; // 最终计算后的y轴最大价格
    _marks = []; // 算好的y轴标签
    _cacheMark = null; 
    _startPoint = null; // 鼠标按下的点
    _calcPriceSnapshot = null;
    _scaleRatio = 1; // y轴缩放倍率, 目前用不上，先预留
    _priceAxisChild; // PriceAxisChild 实例
    _prevPriceChangeIsScroll = false;
    constructor(priceAxisChild,options) {
        this._priceAxisChild = priceAxisChild
        this.mergeOtions(options)
        this.createTickMarkData()
    }
    mergeOtions(options) {
        this._options = Object.assign(this._options, options)
    }
    isLog() {
        return this._options.mode === scaleMode.logarithmic
    }
    isPercentage() {
        return this._options.mode === scaleMode.rercentage
    }
    isIndexedTo100() {
        return this._options.mode === scaleMode.indexedTo100
    }
    isInverted() {
        return this._options.invertScale;
    }
  
    topMarginPx() {
        return this.isInverted()
            ? this._options.scaleMargins.bottom * this.height() + this._marginBelow
            : this._options.scaleMargins.top * this.height() + this._marginAbove; 
    }
    bottomMarginPx() {
        return this.isInverted() 
            ? this._options.scaleMargins.top * this.height() + this._marginAbove
            : this._options.scaleMargins.bottom * this.height() + this._marginBelow
    }
    height() {
        return this._options.height
    }
    internalHeight() {
        return this.height() - this.topMarginPx() - this.bottomMarginPx()
    }
    invertedCoordinate(coordinate) {
        return this.isInverted() ? coordinate : this.height()  - coordinate
    }
    _originPriceRange() {
        return {
            max: this._options.maxValue,
            min: this._options.minValue,
            rangeDiff: this._options.maxValue - this._options.minValue
        }
    }
    getCalcPriceRange() {
        return {
            max: this._calcMaxValue,
            min: this._calcMinValue,
            rangeDiff: this._calcMaxValue- this._calcMinValue
        }
    }
    setPriceRange({minValue, maxValue}) {
        this._options.maxValue = maxValue
        this._options.minValue = minValue
        if (this._options.fixed) {
            this.createTickMarkData()
        }
    }
    setMode(mode) {
        this._options.mode = mode
    }
    setFixed(value, updateTick = false) {
        this._options.fixed = value;
        updateTick && this.createTickMarkData();
    }
    isFixed() {
        return this._options.fixed
    }
 
    // 包含留白坐标转价格
    _originCoordinateToPrice(coordinate) {
        const invCoordinate = this.invertedCoordinate(coordinate);
        const originRange = this._originPriceRange();
        const priceVal = originRange.min + originRange.rangeDiff * (invCoordinate - this.bottomMarginPx()) / this.internalHeight()
        return priceVal;
    }
    // 输入y轴坐标 获取 y轴价格
    coordinateToPrice(coordinate) {
        const height = this.height();
        const invCoordinate = this.invertedCoordinate(coordinate);
        const calcRange = this.getCalcPriceRange()
        const price = calcRange.min +  calcRange.rangeDiff * invCoordinate / height
        return price;
    }
    // 输入价格，获取y轴px
    priceToCoordinate(price) {
        if (isString(price)) {
            price = Number(price);
        }
        const height = this.height()
        const { rangeDiff,max,min } = this.getCalcPriceRange()
        const priceDeltaRatio = (price - min) / rangeDiff;
        return (1 - priceDeltaRatio) * height
    }

    // 划分y轴刻度
    createTickMarkData(options, isForceUpdate = false) {
        const height = this.height();
        const {min, max} = this._originPriceRange()
        if (
            !isForceUpdate
            && this._cacheMark 
            && this._cacheMark.min === min
            && this._cacheMark.max === max
            && this._cacheMark.height === height
        ) {
            return;
        }
        const {bottomValue, topValue, tickDiffValue} = options || {}
        const bottom = bottomValue ||  this._originCoordinateToPrice(height)
        const top = topValue || this._originCoordinateToPrice(0)
     
        const minValue = this._calcMinValue = Math.min(bottom, top)
        const maxValue = this._calcMaxValue = Math.max(bottom, top)
        let tickDiff = tickDiffValue || this.tickDiff(maxValue, minValue)
        const marks = this._marks =  []
        // 从最大到最小价格划分
        let mod = maxValue % tickDiff
        mod += mod < 0 ? tickDiff : 0;
        const sign = (maxValue > minValue) ? 1 : -1;
        let prevPixel = null, minPixel = 0, maxPixel = this.height();
        let targetIndex = 0;
        for (let priceTick =  maxValue - mod; priceTick > minValue; priceTick -= tickDiff) {
            const pixel = this.priceToCoordinate(priceTick)
            if (prevPixel !== null && Math.abs(pixel - prevPixel) < this.tickMarkHeight()) {
                continue;
            }
            if (pixel < minPixel || pixel > maxPixel) {
                continue;
            }
            const item = {
                priceTick,
                priceTickLabel: priceTick.toFixed(this.precision()),
                pixel
            }
            targetIndex < marks.length ? (marks[targetIndex] = item ): marks.push(item);
            targetIndex++;
            prevPixel = pixel;
            if (this.isLog()) {
                tickDiff = this.tickDiff(priceTick * sign, minValue)
            }
        }
        marks.length = targetIndex
        this._cacheMark = {
            min,
            max,
            height,
            tickDiffValue: tickDiff
        }
        this._priceAxisChild.render();
    }
    // 设置价格轴标签之间的价差为多少
    tickDiff(max, min) {
        const height = this.height();
        const markHeight = this.tickMarkHeight();
        // maxTick 就是固定像素下的价格差
        const maxTick = (max - min) * markHeight / height;
        const tickCalculator = new PriceTickSpanCalculator(this.precisionPow(), [2, 2.5, 2]);
        const calcTick = tickCalculator.tickSpan(max, min, maxTick);
        return calcTick;
    }
    // 传入倍率重设y轴最大最小计算值
    resetCalcPriceRangeByRatio(max, min, ratio) {
        if (max - min === 0) return;
        const center = (max + min) / 2;
        let maxDelta = max - center;
        let minDelta = min - center;
        maxDelta *= ratio
        minDelta *= ratio;
        max = center + maxDelta
        min = center + minDelta
        this._scaleRatio = ratio
        return { max, min}
    }
    // 鼠标缩放开始
    startScale(y) {
        if (this.isPercentage() || this.isIndexedTo100())  return;
        if (this.isEmpty()) return;
        this._startPoint =  y;
        this._calcPriceSnapshot = {...this.getCalcPriceRange()}
    }
    scaleTo(y) {
        if (this.isPercentage() || this.isIndexedTo100())  return;
        if (!this._startPoint) return;
        this.setFixed(false)
        let scaleRatio =  (y + this.height()  * 0.2) / (this._startPoint + this.height()  * 0.2);
        scaleRatio = Math.max(scaleRatio, 0.1)
        // 根据缩放比率然后算出新的最大值，最小值
        const { max, min } = this.resetCalcPriceRangeByRatio(this._calcPriceSnapshot.max, this._calcPriceSnapshot.min, scaleRatio)
      
        this.createTickMarkData({
            bottomValue: min, 
            topValue: max,
        },true)
    }
    endScale() {
        if (this.isPercentage() || this.isIndexedTo100()) {
            return;
        }
        this._startPoint = null;
        this._calcPriceSnapshot = null;
    }
    startScroll(y) {
        if (this.isFixed() || this.isEmpty()) return;
        this._startPoint =  y;
        this._calcPriceSnapshot = {...this.getCalcPriceRange()}
    }
    scrollTo(y) {
        if (this.isFixed()) return;
        if (!this._startPoint) return;
        let { rangeDiff, max, min } = this._calcPriceSnapshot
        const priceUnitsPerPixel = rangeDiff / this.height()
        let pixelDelta = y - this._startPoint 
        
        if (this.isInverted()) {
            pixelDelta *= -1
        }
        const priceDelta = pixelDelta * priceUnitsPerPixel
        max += priceDelta
        min += priceDelta
        this.createTickMarkData({
            bottomValue: min, 
            topValue: max,
            tickDiffValue: this._cacheMark?.tickDiffValue
        }, true)
       
    }
    endSroll() {
        if (this.isFixed()) return;
        this._startPoint = null;
        this._calcPriceSnapshot = null;
    }


    setHeight(value) {
        if (this._options.height === value) return
        this._options.height = value
        this.createTickMarkData();
    }
    precision() {
        return this._options.precision
    }
    precisionPow() {
        return Math.pow(10, this.precision())
    }
    isEmpty() {
        return this._marks.length === 0
    }

    marks() {
        return this._marks;
    }
    fontHeight() {
        return this._options.fontSize;
    }
    tickMarkHeight() {
        return Math.ceil(this.fontHeight() * this._tickDensity);
    }
}