export class BaseWidget {
    getOptions() {
        return this._options
    }
    getNode() {
        return this._ele
    }
    getSize() {
      return {
        width: this._options.width,
        height: this._options.height
      }
    }
    height() {
      return this._options.height
    }
    width() {
      return this._options.width
    }

}