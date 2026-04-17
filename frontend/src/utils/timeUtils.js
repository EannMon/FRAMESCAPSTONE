/**
 * Time formatting utilities for FRAMES frontend.
 * Shared across all modules (student, faculty, dept head).
 */

/**
 * Returns the local date as a YYYY-MM-DD string.
 * Unlike toISOString().split('T')[0], this uses the browser's local timezone
 * so it won't show "yesterday" between midnight and UTC+8 offset.
 * @param {Date} [d=new Date()] - Date object to format
 * @returns {string} Date in YYYY-MM-DD format (local timezone)
 */
export const getLocalDateString = (d = new Date()) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

/**
 * Converts 24-hour time string (e.g., "22:45:00" or "08:30") to 12-hour format ("10:45 PM").
 * @param {string} timeStr - Time string in 24hr format
 * @returns {string} Formatted 12hr time string
 */
export const formatTo12Hr = (timeStr) => {
    if (!timeStr) return '—';
    const parts = timeStr.split(':');
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1] || '00';
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
};

/**
 * Formats a time range from two 24hr strings into 12hr display.
 * @param {string} startTime - Start time in 24hr format
 * @param {string} endTime - End time in 24hr format
 * @returns {string} e.g., "8:00 AM - 9:30 AM"
 */
export const formatTimeRange = (startTime, endTime) => {
    return `${formatTo12Hr(startTime)} - ${formatTo12Hr(endTime)}`;
};
