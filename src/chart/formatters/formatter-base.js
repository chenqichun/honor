export class FormatterBase {
    formatTickmarks(prices) {
        return prices.map((price) => this.format(price));
    }
}
