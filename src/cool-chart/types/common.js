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

export function clone(object) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const o = object;
    if (!o || 'object' !== typeof o) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return o;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let c;
    if (Array.isArray(o)) {
        c = [];
    }
    else {
        c = {};
    }
    let p;
    let v;
    // eslint-disable-next-line no-restricted-syntax
    for (p in o) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call,no-prototype-builtins
        if (o.hasOwnProperty(p)) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            v = o[p];
            if (v && 'object' === typeof v) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                c[p] = clone(v);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                c[p] = v;
            }
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return c;
}

export function merge(dst, ...sources) {
    for (const src of sources) {
        // eslint-disable-next-line no-restricted-syntax
        for (const i in src) {
            if (src[i] === undefined ||
                !Object.prototype.hasOwnProperty.call(src, i) ||
                ['__proto__', 'constructor', 'prototype'].includes(i)) {
                continue;
            }
            if ('object' !== typeof src[i] || dst[i] === undefined || Array.isArray(src[i])) {
                dst[i] = src[i];
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                merge(dst[i], src[i]);
            }
        }
    }
    return dst;
}


export function clamp(value, minVal, maxVal) {
    return Math.min(Math.max(value, minVal), maxVal);
}
export function isBaseDecimal(value) {
    if (value < 0) {
        return false;
    }
    // cannot calculate exactly due to rounding error
    if (value > 1e18) {
        return true;
    }
    for (let current = value; current > 1; current /= 10) {
        if ((current % 10) !== 0) {
            return false;
        }
    }
    return true;
}
export function greaterOrEqual(x1, x2, epsilon) {
    return (x2 - x1) <= epsilon;
}
export function equal(x1, x2, epsilon) {
    return Math.abs(x1 - x2) < epsilon;
}
// We can't use Math.min(...arr) because that would only support arrays shorter than 65536 items.
export function min(arr) {
    if (arr.length < 1) {
        throw Error('array is empty');
    }
    let minVal = arr[0];
    for (let i = 1; i < arr.length; ++i) {
        if (arr[i] < minVal) {
            minVal = arr[i];
        }
    }
    return minVal;
}
export function ceiledEven(x) {
    const ceiled = Math.ceil(x);
    return (ceiled % 2 !== 0) ? ceiled - 1 : ceiled;
}
export function ceiledOdd(x) {
    const ceiled = Math.ceil(x);
    return (ceiled % 2 === 0) ? ceiled - 1 : ceiled;
}
