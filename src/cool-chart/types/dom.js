export function getEleStyle(ele, key) {
    return window.getComputedStyle(ele)[key]
}

export function createEle(tag = 'div', className) {
    const ele = document.createElement(tag)
    if (className) ele.className = className;
    return ele
}

export function setEleStyle(ele, styleObj) {
    Object.entries(styleObj).forEach(([key,value]) => ele.style[key] = value);
    return ele;
}

export function setEleStyleByKey(ele, key, value) {
    ele.style[key] = value
    return ele
}

export const widgetDefaultOption = {
    left: null,
    top: null,
    width: null,
    height: null
}

export function getDevicePixelRatio() {
    return window.devicePixelRatio
}

export function setAttribute(ele, attrObj) {
    Object.entries(attrObj).forEach(([key,value]) => ele.setAttribute(key, value));
    return ele;
}