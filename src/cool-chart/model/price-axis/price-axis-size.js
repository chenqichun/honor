/**
 * 处理某个子面板中的某个y轴宽度变化，同步修改所有对应位置的y轴变化
 * 如比较复杂的情况，左边y轴有a,b两个轴，右边也有a，b两个轴，那么左边的a改变的时候，所有子面板的的a轴的宽度要不改变，
 * 然后再修改子面板的其它内容的尺寸
 */

// 获取可以在这里检测，比如没渲染一遍我就调用这里的来检测所有y轴的宽度（因为是数字，可以可以通过数字长度来判断，排除., 然后计算出最大的宽度和当前最大宽度来对比）

export const priceAxisWidthTypes = {
    L: 1, // 左
    R: 2 // 右
}

export class PriceAxisSize {
    _chartWidget;
    _axisWidthMap = new Map(); // 保存所有价格y轴的尺寸，包含左右

    constructor(chartWidget) {
        this._chartWidget = chartWidget;
        this._axisWidthMap.set(priceAxisWidthTypes.L,[]) 
        this._axisWidthMap.set(priceAxisWidthTypes.R,[])
    }
    // 检查某个y轴
    checkSize(priceAxisWidthType, index, maxTextWidth) {

    }

    destroyed() {
        this._axisWidthMap.clear();
        this._axisWidthMap = null;
    }
}