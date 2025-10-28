export class ImageWatermarkRenderer {
    _data;
    constructor(data) {
        this._data = data;
    }
    draw(target) {
        target.useMediaCoordinateSpace((scope) => {
            const ctx = scope.context;
            const pos = this._determinePlacement(this._data, scope.mediaSize);
            if (!pos || !this._data.imgElement) {
                return;
            }
            ctx.globalAlpha = this._data.alpha ?? 1;
            ctx.drawImage(this._data.imgElement, pos.x, pos.y, pos.width, pos.height);
        });
    }
    _determinePlacement(data, paneSize) {
        const { maxHeight, maxWidth, imgHeight, imgWidth, padding } = data;
        const plotCentreX = Math.round(paneSize.width / 2);
        const plotCentreY = Math.round(paneSize.height / 2);
        const paddingSize = padding ?? 0;
        let availableWidth = paneSize.width - 2 * paddingSize;
        let availableHeight = paneSize.height - 2 * paddingSize;
        if (maxHeight) {
            availableHeight = Math.min(availableHeight, maxHeight);
        }
        if (maxWidth) {
            availableWidth = Math.min(availableWidth, maxWidth);
        }
        const scaleX = availableWidth / imgWidth;
        const scaleY = availableHeight / imgHeight;
        const scaleToUse = Math.min(scaleX, scaleY);
        const drawWidth = imgWidth * scaleToUse;
        const drawHeight = imgHeight * scaleToUse;
        const x = plotCentreX - 0.5 * drawWidth;
        const y = plotCentreY - 0.5 * drawHeight;
        return {
            x,
            y,
            height: drawHeight,
            width: drawWidth,
        };
    }
}
