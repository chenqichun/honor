export const customStyleDefaults = {
    color: '#2196f3',
};
export const seriesOptionsDefaults = {
    title: '',
    visible: true,
    lastValueVisible: true, // 就是y轴上的最新价格
    priceLineVisible: true, // 就是y轴上的最新价格线
    priceLineSource: 0 /* PriceLineSource.LastBar */,
    priceLineWidth: 1,
    priceLineColor: '',
    priceLineStyle: 2 /* LineStyle.Dashed */,
    baseLineVisible: true,
    baseLineWidth: 1,
    baseLineColor: '#B2B5BE',
    baseLineStyle: 0 /* LineStyle.Solid */,
    priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
    },
};
