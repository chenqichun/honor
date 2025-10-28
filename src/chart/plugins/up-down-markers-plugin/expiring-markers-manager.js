export class ExpiringMarkerManager {
    _markers = new Map();
    _updateCallback;
    constructor(updateCallback) {
        this._updateCallback = updateCallback;
    }
    setMarker(marker, key, timeout) {
        this.clearMarker(key);
        if (timeout !== undefined) {
            const timeoutId = window.setTimeout(() => {
                this._markers.delete(key);
                this._triggerUpdate();
            }, timeout);
            const markerWithTimeout = {
                ...marker,
                timeoutId,
                expiresAt: Date.now() + timeout,
            };
            this._markers.set(key, markerWithTimeout);
        }
        else {
            // For markers without timeout, we set timeoutId and expiresAt to undefined
            this._markers.set(key, {
                ...marker,
                timeoutId: undefined,
                expiresAt: undefined,
            });
        }
        this._triggerUpdate();
    }
    clearMarker(key) {
        const marker = this._markers.get(key);
        if (marker && marker.timeoutId !== undefined) {
            window.clearTimeout(marker.timeoutId);
        }
        this._markers.delete(key);
        this._triggerUpdate();
    }
    clearAllMarkers() {
        for (const [point] of this._markers) {
            this.clearMarker(point);
        }
    }
    getMarkers() {
        const now = Date.now();
        const activeMarkers = [];
        for (const [time, marker] of this._markers) {
            if (!marker.expiresAt || marker.expiresAt > now) {
                activeMarkers.push({ time: marker.time, sign: marker.sign, value: marker.value });
            }
            else {
                this.clearMarker(time);
            }
        }
        return activeMarkers;
    }
    setUpdateCallback(callback) {
        this._updateCallback = callback;
    }
    _triggerUpdate() {
        if (this._updateCallback) {
            this._updateCallback();
        }
    }
}
