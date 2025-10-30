export function InputError(message) {
    throw new Error(`Find failed: ${message}`)
}
export function getPrefixClass(className) {
    return `cool-chart-${className}`
}

export function getRandomStr(prevFix) {
    const ran = `${Date.now()}-${Math.random()}`.replace(/\./,'')
    return prevFix ? `${prevFix}-${ran}` : ran
}