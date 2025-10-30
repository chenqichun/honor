/**
 * 每个容器都有两个canvas,一个用于主绘制，另一个用于鼠标事件
 */
import {getDevicePixelRatio, createEle, setAttribute, setEleStyle} from '../types/dom'
import {getRandomStr} from '../types/common'
export class CanvasWidget {
  _drawCanvas;
  _coverCanvas;
  _wrap;
  _options;
  _name;
  constructor(options){
    this._options = options;
    this._name = options.name || getRandomStr();
    this.createElement();
  }
  createElement(){
    const {width,height, className = ''} = this._options;
    this._wrap = createEle('div', `panel-canvas-widget ${className}`);
    this._drawCanvas = createEle('canvas');
    this._coverCanvas = createEle('canvas')
    this._wrap.appendChild(this._drawCanvas)
    this._wrap.appendChild(this._coverCanvas)
    // 设置属性
    setAttribute(this._drawCanvas, {'date-name': 'draw-canvas','aria-hidden': true});
    setAttribute(this._coverCanvas, {'date-name': 'cover-canvas','aria-label': ''}); // 补充品种信息
    // 设置样式
    setEleStyle(this._drawCanvas, this.getDefaultStyles());
    setEleStyle(this._coverCanvas, this.getDefaultStyles());
    this.setSize(width,height)
  }
  // 设置尺寸和PixelRatio
  setSize(width,height) {
    width = parseInt(width);
    height = parseInt(height);
    const dpRatio = getDevicePixelRatio();
    // 不使用ctx.scale
    this._drawCanvas.width = parseInt(width * dpRatio)
    this._drawCanvas.height = parseInt(height * dpRatio)
    this._coverCanvas.width = parseInt(width * dpRatio)
    this._coverCanvas.height = parseInt(height * dpRatio)

    setEleStyle(this._drawCanvas, {width: width + 'px', height: height + 'px'});
    setEleStyle(this._coverCanvas, {width: width + 'px', height: height + 'px'});
  }
  getNode() {
    return this._wrap
  }
  getName() {
    return this._name
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

}