
/*
创建每个小面板，如 k线面版 | 附图指标面版 | 时间轴
每个PanelWidget都会包含左，中，右边三部分
*/
import {
    createEle,
    setEleStyle
} from '../types/dom'

export class PanelWidget {
    _ele; // PanelWidget本身元素
    constructor() {

    }
    createElement() {
        this._ele = createEle('div', 'panel-flex-row');
        setEleStyle(this._ele, {display: 'flex'})
        
    }
}