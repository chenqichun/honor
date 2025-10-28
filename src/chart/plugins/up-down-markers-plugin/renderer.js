export class MarkersPrimitiveRenderer {
    _data;
    _neutralColor;
    _negativeColor;
    _positiveColor;
    constructor(data, neutralColor, negativeColor, positiveColor) {
        this._data = data;
        this._neutralColor = neutralColor;
        this._negativeColor = negativeColor;
        this._positiveColor = positiveColor;
    }
    draw(target) {
        target.useBitmapCoordinateSpace((scope) => {
            const ctx = scope.context;
            const tickWidth = Math.max(1, Math.floor(scope.horizontalPixelRatio));
            const correction = (tickWidth % 2) / 2;
            const rad = 4 /* Constants.Radius */ * scope.verticalPixelRatio + correction;
            this._data.forEach((item) => {
                const centreX = Math.round(item.x * scope.horizontalPixelRatio) + correction;
                ctx.beginPath();
                const color = this._getColor(item.sign);
                ctx.fillStyle = color;
                ctx.arc(centreX, item.y * scope.verticalPixelRatio, rad, 0, 2 * Math.PI, false);
                ctx.fill();
                if (item.sign) {
                    ctx.strokeStyle = color;
                    ctx.lineWidth = Math.floor(2 /* Constants.ArrowLineWidth */ * scope.horizontalPixelRatio);
                    ctx.beginPath();
                    ctx.moveTo((item.x - 4.7 /* Constants.ArrowSize */) * scope.horizontalPixelRatio + correction, (item.y - 7 /* Constants.ArrowOffset */ * item.sign) *
                        scope.verticalPixelRatio);
                    ctx.lineTo(item.x * scope.horizontalPixelRatio + correction, (item.y -
                        7 /* Constants.ArrowOffset */ * item.sign -
                        7 /* Constants.ArrowOffset */ * item.sign * 0.5 /* Constants.VerticalScale */) *
                        scope.verticalPixelRatio);
                    ctx.lineTo((item.x + 4.7 /* Constants.ArrowSize */) * scope.horizontalPixelRatio + correction, (item.y - 7 /* Constants.ArrowOffset */ * item.sign) *
                        scope.verticalPixelRatio);
                    ctx.stroke();
                }
            });
        });
    }
    _getColor(sign) {
        if (sign === 0) {
            return this._neutralColor;
        }
        return sign > 0 ? this._positiveColor : this._negativeColor;
    }
}
