import { ChartContainer} from '../views/main-widget'
import { ChartWidget } from '../views/chart-widget'
import { ChartLayoutHandler } from '../handler/chart-layout-handler'
import {ChartWidgetHandler} from '../handler/chartwidget-handler'
import {
    InputError
} from '../types/common'
export class CoolChart {
    _chartContainer;
    $chartWidgetHandler; // 对图表进行相关操作
    $chartLayoutHandler; // 操作图表布局
    _chartOptions;
    constructor(container, chartOptions) {
        this._chartOptions = chartOptions;
        this._chartContainer = new ChartContainer(container,this.getRoot());
        this.$chartLayoutHandler = new ChartLayoutHandler(this.getRoot());
        this.$chartWidgetHandler = new ChartWidgetHandler(this.getRoot());
    }
    // 添加品种图表
    addChart(options, stockData) {
        if (!options?.stockId) InputError(`the stockId is not in options at: addChartWidget`);
        const { stockId } = options
        const name = `${stockId}_${Date.now()}_${Math.random()}`.replace(/\./,'')
        const chartOption = {name, ...this.getRoot()}
        const chartWidgetInstance = new ChartWidget(this, this._chartContainer.getContainer(), chartOption)
        this.$chartWidgetHandler.addChartWidget(chartWidgetInstance)
    }
    // 传给各各类中，让它可以访问跟实例的所有内容
    getRoot() {
        return {
            _$root: this
        }
    }
    
}


export  function createChart(container, options) {
    return new CoolChart(container, options)
}