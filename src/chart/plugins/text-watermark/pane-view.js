import { makeFont } from '../../helpers/make-font';
import { TextWatermarkRenderer, } from './pane-renderer';
export class TextWatermarkPaneView {
    _options;
    constructor(options) {
        this._options = buildRendererOptions(options);
    }
    update(options) {
        this._options = buildRendererOptions(options);
    }
    renderer() {
        return new TextWatermarkRenderer(this._options);
    }
}
function buildRendererLineOptions(lineOption) {
    return {
        ...lineOption,
        font: makeFont(lineOption.fontSize, lineOption.fontFamily, lineOption.fontStyle),
        lineHeight: lineOption.lineHeight || lineOption.fontSize * 1.2,
        vertOffset: 0,
        zoom: 0,
    };
}
function buildRendererOptions(options) {
    return {
        ...options,
        lines: options.lines.map(buildRendererLineOptions),
    };
}
