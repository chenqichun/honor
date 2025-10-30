
/**
 * 用于每个面版内部的tooltip
 */
import {
    AddChartChildBase,
} from './add-chartchild-base'


export class PanelTooltip extends AddChartChildBase {
    constructor(chartWidget) {
        super(chartWidget, {className: 'panel-tooltip-wrap'})
    }
}