// DataLayer做为数据储存，应用场景有，图表品种的数据 | 叠加品种的数据 | 特殊指标的数据
// item结构如下
/**
 * {
     s = 开始时间戳，闭区间
     e = 结束时间戳， 开区间，可能没有，普通情况下可以通过s + 周期推算，如果存在跨天，跨月等，那就不能简单换算
     h = 高
     o = 开
     l = 低
     c = 收
     v = 成交量
     a = 成交额
     cha = 涨跌额
     char = 涨跌幅
   }
 */
import { InputError } from '../../types/common'

export class DataLayer extends DateLayerBase {
    _dataList = []; // 数据的储存，最开始的索引是老数据，最后的索引是新数据
    _futureDataList = []; // 这里存放未来时间的推算
    _dataTimeMap = new Map(); // 目前开始时间
    constructor(options) {}
    // 初始化数据
    setData(dataList) {
        this._dataList = this.forMaterData(dataList)
        this.updateTimeMap()
    }
    /**
     * 
     * @param {Array} dataList 数据
     * @param {Boolean} isHistory 是否是添加历史数据
     */
    addData(dataList, isHistory = false) {
        if (dataList.length === 0) return;
        dataList = this.forMaterData(dataList)
        // 往旧的数据
        if (isHistory) {
            const firstData = this.firstData();
            const newHistoryLastData = dataList[dataList.length - 1]
            // 判断数据有没有重复，
            if (newHistoryLastData.s >= firstData.s) {
                let idx = dataList.findLastIndex(e => e.s === firstData.s);
                if (idx === -1) InputError('the history data is has some question in addData')
                dataList.splice(idx)
            }
            this._dataList = dataList.concat(this._dataList)
        } else {
            // 往新的数据
            const lastData = this.lastData()
            const newFirstData = dataList[0];
            if (newFirstData.s <= lastData.s) {
                let idx = this._dataList.findLastIndex(e => e.s === newFirstData.s);
                if (idx === -1) InputError('the new data is has some question in addData')
                this._dataList.splice(idx)
            }
            this._dataList = this._dataList.concat(dataList)
        }
        this.updateTimeMap()
    }
    // 更新最新一个点
    updateNewPoint(data) {
        // 先格式化最新一个点所需要的格式，后补
        const firstFd = this.firstFeatureData();
        const last = this.lastData();
        if (data.s < last.s) return;
        // 更新最后一个点
        if (data.s >= last.s && data.s < firstFd.s) {
            const newData = {...last, ...data}
            this._dataList[this._dataList.length - 1] = newData;
            this._dataTimeMap.set(newData.s, newData)
        } else {
            // 查找未来时间的索引，如果是最新一个未来点的范围就是正常，否则就有可能是推动没推或者中间断掉，这时候要补充中间断掉的k线
            let idx = this._futureDataList.findIndex(fd => data.s >= fd.s && e.s < fd.e);
            if (idx === 0) {
                this._dataList.push(data)
                this._dataTimeMap.set(data.s, data)
            } else {
                // 中间有漏掉的点需要补充，后补
            }
            // 检测未来时间需不需要重新计算（时间不对或者长度不够都要重新计算）
        }
    }
    updateTimeMap() {
        this._dataList.forEach(e => this._dataTimeMap.set(e.s, e))
    }
    destroyed() {
        this._dataTimeMap.clear();
        this._dataTimeMap = null;
        this._dataList = null
        this._futureDataList = null
    }
}