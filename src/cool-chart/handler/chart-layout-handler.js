import {
    InputError
} from '../types/common'

import {layoutTypes} from '../types/constant'

export class ChartLayoutHandler {
    _type;
    _$root;
    constructor(options) {
        this._type = layoutTypes.full
        this._$root = options._$root;
    }
    getType() {
        return this._type 
    }
    setType(type) {
        if (!isExist(layoutTypes[type])) {
            InputError('type is not in layoutTypes at: ChartLayoutHandler.setType')
        }
        this._type = type
    }
}