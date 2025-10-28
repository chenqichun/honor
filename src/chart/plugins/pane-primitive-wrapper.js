export class PanePrimitiveWrapper {
    _primitive;
    _pane;
    constructor(pane, primitive) {
        this._pane = pane;
        this._primitive = primitive;
        this._attach();
    }
    detach() {
        this._pane.detachPrimitive(this._primitive);
    }
    getPane() {
        return this._pane;
    }
    applyOptions(options) {
        this._primitive.applyOptions?.(options);
    }
    _attach() {
        this._pane.attachPrimitive(this._primitive);
    }
}
