import { SeriesPrimitiveAdapter, } from '../series-primitive-adapter';
import { UpDownMarkersPrimitive } from './primitive';
class SeriesUpDownMarkerPrimitiveWrapper extends SeriesPrimitiveAdapter {
    setData(data) {
        return this._primitive.setData(data);
    }
    update(data, historicalUpdate) {
        return this._primitive.update(data, historicalUpdate);
    }
    markers() {
        return this._primitive.markers();
    }
    setMarkers(markers) {
        return this._primitive.setMarkers(markers);
    }
    clearMarkers() {
        return this._primitive.clearMarkers();
    }
}
/**
 * Creates and attaches the Series Up Down Markers Plugin.
 *
 * @param series - Series to which attach the Up Down Markers Plugin
 * @param options - options for the Up Down Markers Plugin
 *
 * @returns Api for Series Up Down Marker Plugin. {@link ISeriesUpDownMarkerPluginApi}
 *
 * @example
 * ```js
 * import { createUpDownMarkers, createChart, LineSeries } from 'lightweight-charts';
 *
 * const chart = createChart('container');
 * const lineSeries = chart.addSeries(LineSeries);
 * const upDownMarkers = createUpDownMarkers(lineSeries, {
 *     positiveColor: '#22AB94',
 *     negativeColor: '#F7525F',
 *     updateVisibilityDuration: 5000,
 * });
 * // to add some data
 * upDownMarkers.setData(
 *     [
 *         { time: '2020-02-02', value: 12.34 },
 *         //... more line series data
 *     ]
 * );
 * // ... Update some values
 * upDownMarkers.update({ time: '2020-02-02', value: 13.54 }, true);
 * // to remove plugin from the series
 * upDownMarkers.detach();
 * ```
 */
export function createUpDownMarkers(series, options = {}) {
    const wrapper = new SeriesUpDownMarkerPrimitiveWrapper(series, new UpDownMarkersPrimitive(options));
    return wrapper;
}
