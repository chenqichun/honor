// DataLayer做为数据储存，应用场景有，图表品种的数据 | 叠加品种的数据 | 特殊指标的数据
// item结构如下
/**
 * {
     ts= 开始时间戳，闭区间
     te = 结束时间戳， 开区间，可能没有，普通情况下可以通过ts + 周期推算，如果存在跨天，跨月等，那就不能简单换算
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
import { DateLayerBase } from './data-layer-base' 

export class DataLayer extends DateLayerBase {
    _dataList = []; // 数据的储存，最开始的索引是老数据，最后的索引是新数据
    _futureDataList = []; // 这里存放未来时间的推算
    _dataTimeMap = new Map(); // 目前开始时间
    constructor(options) {
        super(options)
    }
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
            if (newHistoryLastData.ts >= firstData.ts) {
                let idx = dataList.findLastIndex(e => e.ts === firstData.ts);
                if (idx === -1) InputError('the history data is has some question in addData')
                dataList.splice(idx)
            }
            this._dataList = dataList.concat(this._dataList)
        } else {
            // 往新的数据
            const lastData = this.lastData()
            const newFirstData = dataList[0];
            if (newFirstData.ts <= lastData.ts) {
                let idx = this._dataList.findLastIndex(e => e.ts === newFirstData.ts);
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
        if (data.ts < last.ts) return;
        // 更新最后一个点
        if (data.ts >= last.ts && data.ts < firstFd.ts) {
            const newData = {...last, ...data}
            this._dataList[this._dataList.length - 1] = newData;
            this._dataTimeMap.set(newData.ts, newData)
        } else {
            // 查找未来时间的索引，如果是最新一个未来点的范围就是正常，否则就有可能是推动没推或者中间断掉，这时候要补充中间断掉的k线
            let idx = this._futureDataList.findIndex(fd => data.ts >= fd.ts && e.ts < fd.te);
            if (idx === 0) {
                this._dataList.push(data)
                this._dataTimeMap.set(data.ts, data)
            } else {
                // 中间有漏掉的点需要补充，后补
            }
            // 检测未来时间需不需要重新计算（时间不对或者长度不够都要重新计算）
        }
    }
    updateTimeMap() {
        this._dataList.forEach(e => this._dataTimeMap.set(e.ts, e))
    }

    /**
     * 通过索引求出时间
     * @param {*} index 
     * @param {*} considerFeatureTime 是否考虑未来推算时间,默认true
     */
    indexTotime(index, considerFeatureTime = true) {
        return considerFeatureTime 
        ? (this.bothDataList()[index]?.ts ?? null)
        : (this._dataList[index]?.ts ?? null)  
    }
    /**
     * 索引求出k线数据
     * @param {*} index 索引
     * @param {*} considerFeatureTime 是否考虑未来推算时间,默认true
     */
    indexToPoint(index, considerFeatureTime = true) {
        return considerFeatureTime 
            ? (this.bothDataList()[index] ?? null)
            : (this._dataList[index] ?? null)  
    }
       /**
    * 通过时间求出索引
    * @param {*} time 时间戳，任意时间戳
    * @param {*} considerFeatureTime 是否考虑未来推算时间
    * @param {*} findNearest 如果没有数据，是否要找出最靠近的数据
    */
    timeToIndex(time, findNearest = false, considerFeatureTime = true) {
        if (!this.hasData()) return null;
        const list = considerFeatureTime ? this.bothDataList() : this._dataList;
        const len = list.length
        const lastData = list[len - 1]
        const maxTime = lastData.te || lastData.ts;
        const minTime = this.firstData().ts
        if (time >= maxTime && findNearest) return len - 1;
        if (minTime < minTime && findNearest) return 0;
        for (let i = 0; i < len; i++) {
            const {ts, te} = list[i];
            if (ts <= time && time < te) return i;
        }
        return null
    }
    // 通过k线时间时间戳获取对应点的数据
    realTimeToPoint(time) {
        return this._dataTimeMap.get(time)
    }
    bothDataList() {
        return [].concat(this._dataList, this._futureDataList)
    }
    getData() {
        return this._dataList
    }
    destroyed() {
        this._dataTimeMap.clear();
        this._dataTimeMap = null;
        this._dataList = null
        this._futureDataList = null
    }

}