import { DataSource } from './data-source';
export class PriceDataSource extends DataSource {
    _model;
    constructor(model) {
        super();
        this._model = model;
    }
    model() {
        return this._model;
    }
}
