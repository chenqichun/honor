export function isString(value) {
    return typeof value === 'string'
}

export function isHtmlElement(value) {
    return value instanceof HTMLElement
}

export function isExist(value) {
    return value !== null && value !== undefined && value !== ''
}

export function isNumber(value) {
    return typeof value === 'number'
}
