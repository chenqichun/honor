import { size } from 'fancy-canvas';
import { clamp } from '../helpers/mathex';
import { MouseEventHandler } from './mouse-event-handler';
export class PaneSeparator {
    _chartWidget;
    _rowElement;
    _cell;
    _topPane;
    _bottomPane;
    _handle = null;
    _mouseEventHandler = null;
    _resizeEnabled = true;
    _resizeInfo = null;
    constructor(chartWidget, topPaneIndex, bottomPaneIndex) {
        this._chartWidget = chartWidget;
        this._topPane = chartWidget.paneWidgets()[topPaneIndex];
        this._bottomPane = chartWidget.paneWidgets()[bottomPaneIndex];
        this._rowElement = document.createElement('tr');
        this._rowElement.style.height = 1 /* SeparatorConstants.SeparatorHeight */ + 'px';
        this._cell = document.createElement('td');
        this._cell.style.position = 'relative';
        this._cell.style.padding = '0';
        this._cell.style.margin = '0';
        this._cell.setAttribute('colspan', '3');
        this._updateBorderColor();
        this._rowElement.appendChild(this._cell);
        this._resizeEnabled = this._chartWidget.options()['layout'].panes.enableResize;
        if (!this._resizeEnabled) {
            this._handle = null;
            this._mouseEventHandler = null;
        }
        else {
            this._addResizableHandle();
        }
    }
    destroy() {
        if (this._mouseEventHandler !== null) {
            this._mouseEventHandler.destroy();
        }
    }
    getElement() {
        return this._rowElement;
    }
    getSize() {
        return size({
            width: this._topPane.getSize().width,
            height: 1 /* SeparatorConstants.SeparatorHeight */,
        });
    }
    getBitmapSize() {
        return size({
            width: this._topPane.getBitmapSize().width,
            height: 1 /* SeparatorConstants.SeparatorHeight */ * window.devicePixelRatio,
        });
    }
    drawBitmap(ctx, x, y) {
        const bitmapSize = this.getBitmapSize();
        ctx.fillStyle = this._chartWidget.options()['layout'].panes.separatorColor;
        ctx.fillRect(x, y, bitmapSize.width, bitmapSize.height);
    }
    update() {
        this._updateBorderColor();
        if (this._chartWidget.options()['layout'].panes.enableResize !== this._resizeEnabled) {
            this._resizeEnabled = this._chartWidget.options()['layout'].panes.enableResize;
            if (this._resizeEnabled) {
                this._addResizableHandle();
            }
            else {
                if (this._handle !== null) {
                    this._cell.removeChild(this._handle.backgroundElement);
                    this._cell.removeChild(this._handle.element);
                    this._handle = null;
                }
                if (this._mouseEventHandler !== null) {
                    this._mouseEventHandler.destroy();
                    this._mouseEventHandler = null;
                }
            }
        }
    }
    _addResizableHandle() {
        const backgroundElement = document.createElement('div');
        const bgStyle = backgroundElement.style;
        bgStyle.position = 'fixed';
        bgStyle.display = 'none';
        bgStyle.zIndex = '49';
        bgStyle.top = '0';
        bgStyle.left = '0';
        bgStyle.width = '100%';
        bgStyle.height = '100%';
        bgStyle.cursor = 'row-resize';
        this._cell.appendChild(backgroundElement);
        const element = document.createElement('div');
        const style = element.style;
        style.position = 'absolute';
        style.zIndex = '50';
        style.top = '-4px';
        style.height = '9px';
        style.width = '100%';
        style.backgroundColor = '';
        style.cursor = 'row-resize';
        this._cell.appendChild(element);
        const handlers = {
            mouseEnterEvent: this._mouseOverEvent.bind(this),
            mouseLeaveEvent: this._mouseLeaveEvent.bind(this),
            mouseDownEvent: this._mouseDownEvent.bind(this),
            touchStartEvent: this._mouseDownEvent.bind(this),
            pressedMouseMoveEvent: this._pressedMouseMoveEvent.bind(this),
            touchMoveEvent: this._pressedMouseMoveEvent.bind(this),
            mouseUpEvent: this._mouseUpEvent.bind(this),
            touchEndEvent: this._mouseUpEvent.bind(this),
        };
        this._mouseEventHandler = new MouseEventHandler(element, handlers, {
            treatVertTouchDragAsPageScroll: () => false,
            treatHorzTouchDragAsPageScroll: () => true,
        });
        this._handle = { element, backgroundElement };
    }
    _updateBorderColor() {
        this._cell.style.background = this._chartWidget.options()['layout'].panes.separatorColor;
    }
    _mouseOverEvent(event) {
        if (this._handle !== null) {
            this._handle.element.style.backgroundColor = this._chartWidget.options()['layout'].panes.separatorHoverColor;
        }
    }
    _mouseLeaveEvent(event) {
        if (this._handle !== null && this._resizeInfo === null) {
            this._handle.element.style.backgroundColor = '';
        }
    }
    _mouseDownEvent(event) {
        if (this._handle === null) {
            return;
        }
        const totalStretch = this._topPane.state().stretchFactor() + this._bottomPane.state().stretchFactor();
        const totalHeight = this._topPane.getSize().height + this._bottomPane.getSize().height;
        const pixelStretchFactor = totalStretch / totalHeight;
        const minPaneStretch = 30 /* SeparatorConstants.MinPaneHeight */ * pixelStretchFactor;
        if (totalStretch <= minPaneStretch * 2) {
            // cannot resize panes that already have less than minimal height
            // that's possible if there are many panes on the chart
            return;
        }
        this._resizeInfo = {
            startY: event.pageY,
            prevStretchTopPane: this._topPane.state().stretchFactor(),
            maxPaneStretch: totalStretch - minPaneStretch,
            totalStretch,
            pixelStretchFactor,
            minPaneStretch,
        };
        this._handle.backgroundElement.style.display = 'block';
    }
    _pressedMouseMoveEvent(event) {
        const resizeInfo = this._resizeInfo;
        if (resizeInfo === null) {
            return;
        }
        const deltaY = event.pageY - resizeInfo.startY;
        const deltaStretchFactor = deltaY * resizeInfo.pixelStretchFactor;
        const upperPaneNewStretch = clamp(resizeInfo.prevStretchTopPane + deltaStretchFactor, resizeInfo.minPaneStretch, resizeInfo.maxPaneStretch);
        this._topPane.state().setStretchFactor(upperPaneNewStretch);
        this._bottomPane.state().setStretchFactor(resizeInfo.totalStretch - upperPaneNewStretch);
        this._chartWidget.model().fullUpdate();
    }
    _mouseUpEvent(event) {
        if (this._resizeInfo === null || this._handle === null) {
            return;
        }
        this._resizeInfo = null;
        this._handle.backgroundElement.style.display = 'none';
    }
}
