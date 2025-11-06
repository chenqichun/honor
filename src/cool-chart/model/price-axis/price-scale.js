import { fromLog, logFormulaForPriceRange } from './price-scale-conversions'
import { PriceTickSpanCalculator } from './price-tickdiff-calculator'
export const scaleMode = {
    normal: 0, // 价格
    logarithmic: 1, // 对数
    rercentage: 2, // 百分比
    indexedTo100: 3, // 基数100
}

export const defaultOptions = {
    mode: scaleMode.normal, // 显示模式
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
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif"
}

export class PriceScale {
    _tickDensity = 2.5
    _options = {...defaultOptions}
    _marginAbove = 0 // 上留白像素
    _marginBelow = 0 // 下留白像素
    _logFormula = logFormulaForPriceRange(null);
    _calcMinValue = 0; // 最终计算后的y轴最小价格，如未翻转情况下就是canvas的物理高度像素所在的价格
    _calcMaxValue = 0; // 最终计算后的y轴最大价格
    _marks = [];
    constructor(options) {
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
    bottomMarginpX() {
        return this.isInverted() 
            ? this._options.scaleMargins.top * this.height() + this._marginAbove
            : this._options.scaleMargins.bottom * this.height() + this._marginBelow
    }
    height() {
        return this._options.height
    }
    internalHeight() {
        return this.height() - this.topMarginPx() - this.bottomMarginpX()
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
        this.createTickMarkData()
    }
    setMode(mode) {
        this._options.mode = mode
    }
 
    // 包含留白坐标转价格
    _originCoordinateToPrice(coordinate) {
        const invCoordinate = this.invertedCoordinate(coordinate);
        const originRange = this._originPriceRange();
        const priceVal = originRange.min + originRange.rangeDiff * (invCoordinate - this.bottomMarginpX()) / this.internalHeight()
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

    // 划分y轴刻度
    createTickMarkData() {
        const height = this.height();
        const bottom = this._originCoordinateToPrice(height)
        const top = this._originCoordinateToPrice(0)
        const minValue = this._calcMinValue = Math.min(bottom, top)
        const maxValue = this._calcMaxValue = Math.max(bottom, top)
        const tickDiff = this.tickDiff(maxValue, minValue)
        const marks = this._marks = [];
        // 从最大到最小价格划分
        const mod = maxValue % tickDiff
        for (let priceTick =  maxValue - mod; priceTick > minValue; priceTick -= tickDiff) {
            marks.push(priceTick)
        }

    }
    // 设置价格轴标签之间的价差为多少
    tickDiff(max, min) {
        const height = this.height();
        const markHeight = this.tickMarkHeight();
        // maxTick 就是固定像素下的价格差
        const maxTick = (max - min) * markHeight / height;
        // 这个100有可能是10的精度位数次幂，后面再验证
        const tickCalculator = new PriceTickSpanCalculator(100, [2, 2.5, 2]);
        const calcTick = tickCalculator.tickSpan(max, min, maxTick);
        return calcTick;
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