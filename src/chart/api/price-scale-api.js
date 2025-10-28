import { ensureNotNull } from '../helpers/assertions';
import { isDefaultPriceScale } from '../model/default-price-scale';
import { PriceRangeImpl } from '../model/price-range-impl';
import { convertPriceRangeFromLog } from '../model/price-scale-conversions';
import { precisionByMinMove } from '../model/series-options';
export class PriceScaleApi {
    _chartWidget;
    _priceScaleId;
    _paneIndex;
    constructor(chartWidget, priceScaleId, paneIndex) {
        this._chartWidget = chartWidget;
        this._priceScaleId = priceScaleId;
        this._paneIndex = paneIndex ?? 0;
    }
    applyOptions(options) {
        this._chartWidget.model().applyPriceScaleOptions(this._priceScaleId, options, this._paneIndex);
    }
    options() {
        return this._priceScale().options();
    }
    width() {
        if (!isDefaultPriceScale(this._priceScaleId)) {
            return 0;
        }
        return this._chartWidget.getPriceAxisWidth(this._priceScaleId);
    }
    setVisibleRange(range) {
        this.setAutoScale(false);
        this._priceScale().setCustomPriceRange(new PriceRangeImpl(range.from, range.to));
    }
    getVisibleRange() {
        let range = this._priceScale().priceRange();
        if (range === null) {
            return null;
        }
        let from;
        let to;
        if (this._priceScale().isLog()) {
            const minMove = this._priceScale().minMove();
            const minMovePrecision = precisionByMinMove(minMove);
            range = convertPriceRangeFromLog(range, this._priceScale().getLogFormula());
            from = Number((Math.round(range.minValue() / minMove) * minMove).toFixed(minMovePrecision));
            to = Number((Math.round(range.maxValue() / minMove) * minMove).toFixed(minMovePrecision));
        }
        else {
            from = range.minValue();
            to = range.maxValue();
        }
        return {
            from,
            to,
        };
    }
    setAutoScale(on) {
        this.applyOptions({ autoScale: on });
    }
    _priceScale() {
        return ensureNotNull(this._chartWidget.model().findPriceScale(this._priceScaleId, this._paneIndex)).priceScale;
    }
}
