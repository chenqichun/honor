function normalizeRgbComponent(component) {
    if (component < 0) {
        return 0;
    }
    if (component > 255) {
        return 255;
    }
    // NaN values are treated as 0
    return (Math.round(component) || 0);
}
function normalizeAlphaComponent(component) {
    if (component <= 0 || component > 1) {
        return Math.min(Math.max(component, 0), 1);
    }
    // limit the precision of all numbers to at most 4 digits in fractional part
    return (Math.round(component * 10000) / 10000);
}
function rgbaToGrayscale(rgbValue) {
    // Originally, the NTSC RGB to YUV formula
    // perfected by @eugene-korobko's black magic
    const redComponentGrayscaleWeight = 0.199;
    const greenComponentGrayscaleWeight = 0.687;
    const blueComponentGrayscaleWeight = 0.114;
    return (redComponentGrayscaleWeight * rgbValue[0] +
        greenComponentGrayscaleWeight * rgbValue[1] +
        blueComponentGrayscaleWeight * rgbValue[2]);
}
/**
 * For colors which fall within the sRGB space, the browser can
 * be used to convert the color string into a rgb /rgba string.
 *
 * For other colors, it will be returned as specified (i.e. for
 * newer formats like display-p3)
 *
 * See: https://www.w3.org/TR/css-color-4/#serializing-sRGB-values
 */
function getRgbStringViaBrowser(color) {
    const element = document.createElement('div');
    element.style.display = 'none';
    // We append to the body as it is the most reliable way to get a color reading
    // appending to the chart container or similar element can result in the following
    // getComputedStyle returning empty strings on each check.
    document.body.appendChild(element);
    element.style.color = color;
    const computed = window.getComputedStyle(element).color;
    document.body.removeChild(element);
    return computed;
}
export class ColorParser {
    _rgbaCache = new Map();
    _customParsers;
    constructor(customParsers, initialCache) {
        this._customParsers = customParsers;
        if (initialCache) {
            this._rgbaCache = initialCache;
        }
    }
    /**
     * We fallback to RGBA here since supporting alpha transformations
     * on wider color gamuts would currently be a lot of extra code
     * for very little benefit due to actual usage.
     */
    applyAlpha(color, alpha) {
        // special case optimization
        if (color === 'transparent') {
            return color;
        }
        const originRgba = this._parseColor(color);
        const originAlpha = originRgba[3];
        return `rgba(${originRgba[0]}, ${originRgba[1]}, ${originRgba[2]}, ${alpha * originAlpha})`;
    }
    generateContrastColors(background) {
        const rgba = this._parseColor(background);
        return {
            background: `rgb(${rgba[0]}, ${rgba[1]}, ${rgba[2]})`, // no alpha
            foreground: rgbaToGrayscale(rgba) > 160 ? 'black' : 'white',
        };
    }
    colorStringToGrayscale(background) {
        return rgbaToGrayscale(this._parseColor(background));
    }
    gradientColorAtPercent(topColor, bottomColor, percent) {
        const [topR, topG, topB, topA] = this._parseColor(topColor);
        const [bottomR, bottomG, bottomB, bottomA] = this._parseColor(bottomColor);
        const resultRgba = [
            normalizeRgbComponent((topR + percent * (bottomR - topR))),
            normalizeRgbComponent((topG + percent * (bottomG - topG))),
            normalizeRgbComponent((topB + percent * (bottomB - topB))),
            normalizeAlphaComponent((topA + percent * (bottomA - topA))),
        ];
        return `rgba(${resultRgba[0]}, ${resultRgba[1]}, ${resultRgba[2]}, ${resultRgba[3]})`;
    }
    _parseColor(color) {
        const cached = this._rgbaCache.get(color);
        if (cached) {
            return cached;
        }
        const computed = getRgbStringViaBrowser(color);
        const match = computed.match(/^rgba?\s*\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d+))?\)$/);
        if (!match) {
            if (this._customParsers.length) {
                for (const parser of this._customParsers) {
                    const result = parser(color);
                    if (result) {
                        this._rgbaCache.set(color, result);
                        return result;
                    }
                }
            }
            throw new Error(`Failed to parse color: ${color}`);
        }
        const rgba = [
            parseInt(match[1], 10),
            parseInt(match[2], 10),
            parseInt(match[3], 10),
            (match[4] ? parseFloat(match[4]) : 1),
        ];
        this._rgbaCache.set(color, rgba);
        return rgba;
    }
}
