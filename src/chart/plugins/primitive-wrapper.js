export class PrimitiveWrapper {
    _primitive;
    _options;
    constructor(primitive, options) {
        this._primitive = primitive;
        this._options = options;
    }
    detach() {
        this._primitive.detached?.();
    }
    _attachToPrimitive(params) {
        this._primitive.attached?.(params);
    }
    _requestUpdate() {
        this._primitive.updateAllViews?.();
    }
}
