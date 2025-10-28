import { ensureNotNull } from '../../helpers/assertions';
import { TimeAxisViewRenderer } from '../../renderers/time-axis-view-renderer';
export class CrosshairTimeAxisView {
    _invalidated = true;
    _crosshair;
    _model;
    _valueProvider;
    _renderer = new TimeAxisViewRenderer();
    _rendererData = {
        visible: false,
        background: '#4c525e',
        color: 'white',
        text: '',
        width: 0,
        coordinate: NaN,
        tickVisible: true,
    };
    constructor(crosshair, model, valueProvider) {
        this._crosshair = crosshair;
        this._model = model;
        this._valueProvider = valueProvider;
    }
    update() {
        this._invalidated = true;
    }
    renderer() {
        if (this._invalidated) {
            this._updateImpl();
            this._invalidated = false;
        }
        this._renderer.setData(this._rendererData);
        return this._renderer;
    }
    _updateImpl() {
        const data = this._rendererData;
        data.visible = false;
        if (this._crosshair.options().mode === 2 /* CrosshairMode.Hidden */) {
            return;
        }
        const options = this._crosshair.options().vertLine;
        if (!options.labelVisible) {
            return;
        }
        const timeScale = this._model.timeScale();
        if (timeScale.isEmpty()) {
            return;
        }
        data.width = timeScale.width();
        const value = this._valueProvider();
        if (value === null) {
            return;
        }
        data.coordinate = value.coordinate;
        const currentTime = timeScale.indexToTimeScalePoint(this._crosshair.appliedIndex());
        data.text = timeScale.formatDateTime(ensureNotNull(currentTime));
        data.visible = true;
        const colors = this._model.colorParser().generateContrastColors(options.labelBackgroundColor);
        data.background = colors.background;
        data.color = colors.foreground;
        data.tickVisible = timeScale.options().ticksVisible;
    }
}
