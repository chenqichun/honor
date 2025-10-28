import { SeriesPrimitiveAdapter } from '../series-primitive-adapter';
import { SeriesMarkersPrimitive } from './primitive';
class SeriesMarkersPrimitiveWrapper extends SeriesPrimitiveAdapter {
    constructor(series, primitive, markers) {
        super(series, primitive);
        if (markers) {
            this.setMarkers(markers);
        }
    }
    setMarkers(markers) {
        this._primitive.setMarkers(markers);
    }
    markers() {
        return this._primitive.markers();
    }
}
/**
 * A function to create a series markers primitive.
 *
 * @param series - The series to which the primitive will be attached.
 *
 * @param markers - An array of markers to be displayed on the series.
 *
 * @param options - Options for the series markers plugin.
 *
 * @example
 * ```js
 * import { createSeriesMarkers } from 'lightweight-charts';
 *
 *	const seriesMarkers = createSeriesMarkers(
 *		series,
 *		[
 *			{
 *				color: 'green',
 *				position: 'inBar',
 * 				shape: 'arrowDown',
 *				time: 1556880900,
 *			},
 *		]
 *	);
 *  // and then you can modify the markers
 *  // set it to empty array to remove all markers
 *  seriesMarkers.setMarkers([]);
 *
 *  // `seriesMarkers.markers()` returns current markers
 * ```
 */
export function createSeriesMarkers(series, markers, options) {
    const wrapper = new SeriesMarkersPrimitiveWrapper(series, new SeriesMarkersPrimitive(options ?? {}));
    if (markers) {
        wrapper.setMarkers(markers);
    }
    return wrapper;
}
