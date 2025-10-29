import {
    ChartContainer
} from '../views/widget'
export class CoolChart {
    _container;
    constructor(container) {
        this._container = new ChartContainer(container);
    }
}


export  function createChart(container) {
    return new CoolChart(container)
}