import { PanePrimitiveWrapper } from '../pane-primitive-wrapper';
import { imageWatermarkOptionsDefaults, } from './options';
import { ImageWatermarkPaneView } from './pane-view';
function mergeOptionsWithDefaults(options) {
    return {
        ...imageWatermarkOptionsDefaults,
        ...options,
    };
}
class ImageWatermark {
    _requestUpdate;
    _paneViews;
    _options;
    _imgElement = null;
    _imageUrl;
    constructor(imageUrl, options) {
        this._imageUrl = imageUrl;
        this._options = mergeOptionsWithDefaults(options);
        this._paneViews = [new ImageWatermarkPaneView(this._options)];
    }
    updateAllViews() {
        this._paneViews.forEach((pw) => pw.update());
    }
    paneViews() {
        return this._paneViews;
    }
    attached(attachedParams) {
        const { requestUpdate } = attachedParams;
        this._requestUpdate = requestUpdate;
        this._imgElement = new Image();
        this._imgElement.onload = () => {
            const imageHeight = this._imgElement?.naturalHeight ?? 1;
            const imageWidth = this._imgElement?.naturalWidth ?? 1;
            this._paneViews.forEach((pv) => pv.stateUpdate({
                imageHeight,
                imageWidth,
                image: this._imgElement,
            }));
            if (this._requestUpdate) {
                this._requestUpdate();
            }
        };
        this._imgElement.src = this._imageUrl;
    }
    detached() {
        this._requestUpdate = undefined;
        this._imgElement = null;
    }
    applyOptions(options) {
        this._options = mergeOptionsWithDefaults({ ...this._options, ...options });
        this._updateOptions();
        if (this.requestUpdate) {
            this.requestUpdate();
        }
    }
    requestUpdate() {
        if (this._requestUpdate) {
            this._requestUpdate();
        }
    }
    _updateOptions() {
        this._paneViews.forEach((pw) => pw.optionsUpdate(this._options));
    }
}
/**
 * Creates an image watermark.
 *
 * @param pane - Target pane.
 * @param imageUrl - Image URL.
 * @param options - Watermark options.
 *
 * @returns Image watermark wrapper.
 *
 * @example
 * ```js
 * import { createImageWatermark } from 'lightweight-charts';
 *
 * const firstPane = chart.panes()[0];
 * const imageWatermark = createImageWatermark(firstPane, '/images/my-image.png', {
 *   alpha: 0.5,
 *   padding: 20,
 * });
 * // to change options
 * imageWatermark.applyOptions({ padding: 10 });
 * // to remove watermark from the pane
 * imageWatermark.detach();
 * ```
 */
export function createImageWatermark(pane, imageUrl, options) {
    return new PanePrimitiveWrapper(pane, new ImageWatermark(imageUrl, options));
}
