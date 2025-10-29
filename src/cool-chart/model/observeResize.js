
import {
    isHtmlElement
} from '../types/check'
import {
    InputError
} from '../types/common'

/**
 * ObserveResizeWH 只监听宽度变化
 */
export class ObserveResizeWH {
    _ele;
    _observeResize;
    _width;
    _height;
    _callbackList = [];
    constructor(ele,opt) {
        if (!isHtmlElement(ele)) {
            InputError(`class ObserveRise Failed: ele is not a HTMLElement:${ele}`);
        }
        this._ele = ele;
        this.observe(opt?.callback)
    }
    observe(callback) {
        if (callback) this._callbackList.push(callback);
        this._observeResize = new ResizeObserver(entries => {
            const entry = entries[0];
            // 3. 仅获取需要的尺寸（按需选择，避免冗余尺寸计算）
            const width = Math.round(entry.contentRect.width)
            const height = Math.round(entry.contentRect.height)
            if (width!== this._width || height !== _height) {
                this._width = width;
                this._height = height;
                this._callbackList.forEach(cb => cb())
            }
        });
        this._observeResize.observe(this._ele, { box: 'content-box' })
    }
    addCallback(callback) {
        this._callbackList.push(callback)
    }
    destroyed() {
        this._observeResize?.disconnect();
        this._observeResize = null;
        this._width = null;
        this._height = null;
        this._callbackList = [];
    }
}