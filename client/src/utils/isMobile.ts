/// <reference types="user-agent-data-types" />
/**
 * A comprehensive check to determine if the user is on a mobile device.
 * It prioritizes the modern `navigator.userAgentData.mobile` API if available.
 * If not, it falls back to a robust regex against the user agent string.
 * @returns {boolean} True if the device is likely mobile, false otherwise.
 */
export function isMobile(): boolean {
    // Use the modern, more reliable API if it exists.
    if (navigator.userAgentData) {
        return navigator.userAgentData.mobile
    }

    // Fallback to a comprehensive regex for older browsers.
    // This regex is a common pattern for detecting a wide range of mobile devices.
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
    )
}
