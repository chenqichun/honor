import { equal, greaterOrEqual, isBaseDecimal } from '../../types/common';
const TickSpanEpsilon = 1e-14
export class PriceTickSpanCalculator {
    _base;
    _integralDividers;
    _fractionalDividers;
    constructor(base, integralDividers) {
        this._base = base;
        this._integralDividers = integralDividers;
        // 这个主要是判断是不是10，2，5的幂指数
        if (isBaseDecimal(this._base)) {
            this._fractionalDividers = [2, 2.5, 2];
        }
        else {
            this._fractionalDividers = [];
            for (let baseRest = this._base; baseRest !== 1;) {
                if ((baseRest % 2) === 0) {
                    this._fractionalDividers.push(2);
                    baseRest /= 2;
                }
                else if ((baseRest % 5) === 0) {
                    this._fractionalDividers.push(2, 2.5);
                    baseRest /= 5;
                }
                else {
                    throw new Error('unexpected base');
                }
                if (this._fractionalDividers.length > 100) {
                    throw new Error('something wrong with base');
                }
            }
        }
    }
    tickSpan(high, low, maxTickSpan) {
        const minMovement = (this._base === 0) ? (0) : (1 / this._base); // 0.01

        // resultTickSpan 值就是把(high - low)的值取最接近它的10的幂指数
        let resultTickSpan = Math.pow(10, Math.max(0, Math.ceil(Math.log10(high - low)))); 
        let index = 0;
        let c = this._integralDividers[0]; // [2,2.5,2]
        while (true) {
            // the second part is actual for small with very small values like 1e-10
            // greaterOrEqual fails for such values
            const resultTickSpanLargerMinMovement = greaterOrEqual(resultTickSpan, minMovement, TickSpanEpsilon) && resultTickSpan > (minMovement + TickSpanEpsilon);
            const resultTickSpanLargerMaxTickSpan = greaterOrEqual(resultTickSpan, maxTickSpan * c, TickSpanEpsilon);
            const resultTickSpanLarger1 = greaterOrEqual(resultTickSpan, 1, TickSpanEpsilon);
            const haveToContinue = resultTickSpanLargerMinMovement && resultTickSpanLargerMaxTickSpan && resultTickSpanLarger1;
            if (!haveToContinue) {
                break;
            }
            resultTickSpan /= c;
            c = this._integralDividers[++index % this._integralDividers.length];
        }
        if (resultTickSpan <= (minMovement + TickSpanEpsilon)) {
            resultTickSpan = minMovement;
        }
        resultTickSpan = Math.max(1, resultTickSpan);
        if ((this._fractionalDividers.length > 0) && equal(resultTickSpan, 1, TickSpanEpsilon)) {
            index = 0;
            c = this._fractionalDividers[0];
            while (greaterOrEqual(resultTickSpan, maxTickSpan * c, TickSpanEpsilon) && resultTickSpan > (minMovement + TickSpanEpsilon)) {
                resultTickSpan /= c;
                c = this._fractionalDividers[++index % this._fractionalDividers.length];
            }
        }
        return resultTickSpan;
    }
}
