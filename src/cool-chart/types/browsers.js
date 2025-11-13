export function isFF() {
    return window.navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
}
export function isIOS() {
    // eslint-disable-next-line deprecation/deprecation
    return /iPhone|iPad|iPod/.test(window.navigator.platform);
}
export function isChrome() {
    return window.chrome !== undefined;
}
// Determine whether the browser is running on windows.
export function isWindows() {
    // more accurate if available
    if (navigator?.userAgentData?.platform) {
        return navigator.userAgentData.platform === 'Windows';
    }
    return navigator.userAgent.toLowerCase().indexOf('win') >= 0;
}
// Determine whether the browser is Chromium based.
export function isChromiumBased() {
    if (!navigator.userAgentData) {
        return false;
    }
    return navigator.userAgentData.brands.some((brand) => {
        return brand.brand.includes('Chromium');
    });
}
