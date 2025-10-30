export function InputError(message) {
    throw new Error(`Find failed: ${message}`)
}
export function getPrefixClass(className) {
    return `cool-chart-${className}`
}