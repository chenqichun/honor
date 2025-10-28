import { isChrome } from './browsers';
export function preventScrollByWheelClick(el) {
    if (!isChrome()) {
        return;
    }
    el.addEventListener('mousedown', (e) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        if (e.button === 1 /* MouseEventButton.Middle */) {
            // prevent incorrect scrolling event
            e.preventDefault();
            return false;
        }
        return undefined;
    });
}
