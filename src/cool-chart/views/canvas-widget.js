/**
 * 每个容器都有两个canvas,一个用于主绘制，另一个用于鼠标事件
 */
import { createEle, setAttribute, setEleStyle} from '../types/dom'
import {getRandomStr} from '../types/common'
import {isNumber} from '../types/check'
import { BaseWidget } from './baseWidget'
import { ratioPx } from '../render/canvas'
export class CanvasWidget extends BaseWidget{
  _drawCanvas;
  _coverCanvas;
  _ele;
  _parent; 
  _options = {
    name: '',
    width: 0,
    height: 0,
    left: 0,
    top: 0
  };
  constructor(parent,options){
    super(options)
    this._parent = parent;
    this._options = {...this._options, ...options} ;
    this._options.name = options.name || getRandomStr();
    this.createElement();
  }
  createElement(){
    const { className = '', left = 0} = this._options;
    this._ele = createEle('div', `panel-canvas-widget ${className}`, {position: 'absolute', left: left + 'px',top: 0});
    this._drawCanvas = createEle('canvas');
    this._coverCanvas = createEle('canvas')
    this._ele.appendChild(this._drawCanvas)
    this._ele.appendChild(this._coverCanvas)
    // 设置属性
    setAttribute(this._drawCanvas, {'date-name': 'draw-canvas','aria-hidden': true});
    setAttribute(this._coverCanvas, {'date-name': 'cover-canvas','aria-label': ''}); // 补充品种信息
    // 设置样式
    setEleStyle(this._drawCanvas, this.getDefaultStyles());
    setEleStyle(this._coverCanvas, this.getDefaultStyles());
    this.setSize()
  }
  // 设置尺寸和PixelRatio
  setSize(width, height, left) {
    width = parseInt(width || this._options.width);
    height = parseInt(height || this._options.height);
    this._options.width = width;
    this._options.height = height;
    setEleStyle(this._ele, {width: width + 'px', height: height + 'px'})

    // 不使用ctx.scale,改变ctx.scale不适合用于交易图表，普通场景适用
    this._drawCanvas.width = ratioPx(width)
    this._drawCanvas.height = ratioPx(height)
    this._coverCanvas.width = ratioPx(width)
    this._coverCanvas.height = ratioPx(height)

    setEleStyle(this._drawCanvas, {width: width + 'px', height: height + 'px'});
    setEleStyle(this._coverCanvas, {width: width + 'px', height: height + 'px'});
    if (isNumber(left)) {
      setEleStyle(this._ele, {left: left + 'px'});
    }
  }

  getDefaultStyles() {
    return {
      'user-select': 'none', 
      '-webkit-tap-highlight-color': 'transparent',
      position: 'absolute',
      left: 0,
      top: 0,
    }
  }
  coverCanvas() {
    return this._coverCanvas
  }
  coverCtx() {
    return this._coverCanvas.getContext('2d')
  }
  drawCanvas() {
    return this._drawCanvas
  }
  drawCtx() {
    return this._drawCanvas.getContext('2d')
  }
  destroyed() {
    
  }
}