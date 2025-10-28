import { PanePrimitiveWrapper } from '../pane-primitive-wrapper';
import { textWatermarkLineOptionsDefaults, textWatermarkOptionsDefaults, } from './options';
import { TextWatermarkPaneView } from './pane-view';
function mergeLineOptionsWithDefaults(options) {
    return {
        ...textWatermarkLineOptionsDefaults,
        ...options,
    };
}
function mergeOptionsWithDefaults(options) {
    return {
        ...textWatermarkOptionsDefaults,
        ...options,
        lines: options.lines?.map(mergeLineOptionsWithDefaults) ?? [],
    };
}
class TextWatermark {
    requestUpdate;
    _paneViews;
    _options;
    constructor(options) {
        this._options = mergeOptionsWithDefaults(options);
        this._paneViews = [new TextWatermarkPaneView(this._options)];
    }
    updateAllViews() {
        this._paneViews.forEach((pw) => pw.update(this._options));
    }
    paneViews() {
        return this._paneViews;
    }
    attached({ requestUpdate }) {
        this.requestUpdate = requestUpdate;
    }
    detached() {
        this.requestUpdate = undefined;
    }
    applyOptions(options) {
        this._options = mergeOptionsWithDefaults({ ...this._options, ...options });
        if (this.requestUpdate) {
            this.requestUpdate();
        }
    }
}
/**
 * Creates an image watermark.
 *
 * @param pane - Target pane.
 * @param options - Watermark options.
 *
 * @returns Image watermark wrapper.
 *
 * @example
 * ```js
 * import { createTextWatermark } from 'lightweight-charts';
 *
 * const firstPane = chart.panes()[0];
 * const textWatermark = createTextWatermark(firstPane, {
 * 	  horzAlign: 'center',
 * 	  vertAlign: 'center',
 * 	  lines: [
 * 	    {
 * 	      text: 'Hello',
 * 	      color: 'rgba(255,0,0,0.5)',
 * 	      fontSize: 100,
 * 	      fontStyle: 'bold',
 * 	    },
 * 	    {
 * 	      text: 'This is a text watermark',
 * 	      color: 'rgba(0,0,255,0.5)',
 * 	      fontSize: 50,
 * 	      fontStyle: 'italic',
 * 	      fontFamily: 'monospace',
 * 	    },
 * 	  ],
 * });
 * // to change options
 * textWatermark.applyOptions({ horzAlign: 'left' });
 * // to remove watermark from the pane
 * textWatermark.detach();
 * ```
 */
export function createTextWatermark(pane, options) {
    return new PanePrimitiveWrapper(pane, new TextWatermark(options));
}
