import { CrosshairRenderer } from '../../renderers/crosshair-renderer';
export class CrosshairPaneView {
    _invalidated = true;
    _pane;
    _source;
    _rendererData = {
        vertLine: {
            lineWidth: 1,
            lineStyle: 0,
            color: '',
            visible: false,
        },
        horzLine: {
            lineWidth: 1,
            lineStyle: 0,
            color: '',
            visible: false,
        },
        x: 0,
        y: 0,
    };
    _renderer = new CrosshairRenderer(this._rendererData);
    constructor(source, pane) {
        this._source = source;
        this._pane = pane;
    }
    update() {
        this._invalidated = true;
    }
    renderer(pane) {
        if (this._invalidated) {
            this._updateImpl();
            this._invalidated = false;
        }
        return this._renderer;
    }
    _updateImpl() {
        const visible = this._source.visible();
        const crosshairOptions = this._pane.model().options().crosshair;
        const data = this._rendererData;
        if (crosshairOptions.mode === 2 /* CrosshairMode.Hidden */) {
            data.horzLine.visible = false;
            data.vertLine.visible = false;
            return;
        }
        data.horzLine.visible = visible && this._source.horzLineVisible(this._pane);
        data.vertLine.visible = visible && this._source.vertLineVisible();
        data.horzLine.lineWidth = crosshairOptions.horzLine.width;
        data.horzLine.lineStyle = crosshairOptions.horzLine.style;
        data.horzLine.color = crosshairOptions.horzLine.color;
        data.vertLine.lineWidth = crosshairOptions.vertLine.width;
        data.vertLine.lineStyle = crosshairOptions.vertLine.style;
        data.vertLine.color = crosshairOptions.vertLine.color;
        data.x = this._source.appliedX();
        data.y = this._source.appliedY();
    }
}
