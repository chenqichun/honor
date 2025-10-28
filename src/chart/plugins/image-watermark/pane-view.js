import { ImageWatermarkRenderer, } from './pane-renderer';
export class ImageWatermarkPaneView {
    _options;
    _rendererOptions;
    _image = null;
    _imageWidth = 0; // don't draw until loaded
    _imageHeight = 0;
    constructor(options) {
        this._options = options;
        this._rendererOptions = buildRendererOptions(this._options, this._image, this._imageWidth, this._imageHeight);
    }
    stateUpdate(state) {
        if (state.imageWidth !== undefined) {
            this._imageWidth = state.imageWidth;
        }
        if (state.imageHeight !== undefined) {
            this._imageHeight = state.imageHeight;
        }
        if (state.image !== undefined) {
            this._image = state.image;
        }
        this.update();
    }
    optionsUpdate(options) {
        this._options = options;
        this.update();
    }
    zOrder() {
        return 'bottom';
    }
    update() {
        this._rendererOptions = buildRendererOptions(this._options, this._image, this._imageWidth, this._imageHeight);
    }
    renderer() {
        return new ImageWatermarkRenderer(this._rendererOptions);
    }
}
function buildRendererOptions(options, imgElement, imgWidth, imgHeight) {
    return {
        ...options,
        imgElement,
        imgWidth,
        imgHeight,
    };
}
