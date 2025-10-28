export function isDefaultPriceScale(priceScaleId) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    return priceScaleId === "left" /* DefaultPriceScaleId.Left */ || priceScaleId === "right" /* DefaultPriceScaleId.Right */;
}
