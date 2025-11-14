export class DateLayerBase {
    // 格式化数据
    forMaterData(dataList) {
        const res = dataList.sort((a,b) => a.ts - b.te).map(e => {
            const item = e;
            return item
        })
        return res
    }
    firstData() {
        return this._dataList[0]
    }
    lastData() {
        return this._dataList[this._dataList.length - 1]
    }
    firstFeatureData() {
        return this._futureDataList[0]
    }
    length() {
        return this._dataList.length
    }
    hasData() {
        return this._dataList.length > 0
    }
    baseIndex() {
        return this.length() - 1;
    }

}