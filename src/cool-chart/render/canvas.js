
export function getDevicePixelRatio() {
    return window.devicePixelRatio
}

export function ratioPx(value) {
    return Math.floor(value * window.devicePixelRatio)
}

export function clearCanvas(canvas,ctx) {
    ctx = ctx || canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height)
}