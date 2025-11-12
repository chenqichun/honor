// 对各个面版操作的类

export  class ChartWidgetHandler {
    _activeChartName; // 当前激活的品种图表名字
    _$root;
    _chartWidgetMap = new Map();
    constructor(options) {
        this._$root = options._$root;
    }
    // 添加品种图表面版
    addChartWidget(widget, isSetAcctiveName) {
        this._chartWidgetMap.set(widget.name(), widget)
        if (isSetAcctiveName) this._activeChartName = widget.name()
    }
    // 激活目标面版
    setActiveChartWidget(chartName) {
        const chartWidget = this._chartWidgetMap.get(chartName);
        if (!chartWidget) return;
        this._activeChartName = chartName;
        chartWidget.toActive()
    }
    // 获取目标面版
    getActiveChartWidget() {
        return this._chartWidgetMap.get(this._activeChartName);
    }
    // 获取目标面版的名称
    getActiveChartWidgetName() {
        return this._activeChartName
    }
}