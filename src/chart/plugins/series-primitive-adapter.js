export class SeriesPrimitiveAdapter {
    _primitive;
    _series;
    constructor(series, primitive) {
        this._series = series;
        this._primitive = primitive;
        this._attach();
    }
    detach() {
        this._series.detachPrimitive(this._primitive);
    }
    getSeries() {
        return this._series;
    }
    applyOptions(options) {
        if (this._primitive && this._primitive.applyOptions) {
            this._primitive.applyOptions(options);
        }
    }
    _attach() {
        this._series.attachPrimitive(this._primitive);
    }
}
