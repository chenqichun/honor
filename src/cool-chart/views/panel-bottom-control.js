
import {
    AddChartChildBase,
} from './add-chartchild-base'


export class PanelBottomControl extends AddChartChildBase {
    constructor(chartWidget) {
        super(chartWidget, {className: 'panel-bottom-control'})
    }
}