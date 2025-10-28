import { GridPaneView } from '../views/pane/grid-pane-view';
export class Grid {
    _paneView;
    constructor(pane) {
        this._paneView = new GridPaneView(pane);
    }
    paneView() {
        return this._paneView;
    }
}
