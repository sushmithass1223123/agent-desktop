/**
 * Interface for polyfill "dateCustomFormat"
 * File is present in "polyfills/dateCustomFormat.js"
 */
export interface CustomDate extends Date {
    /**
     * Prototype function for "Date" to format the date
     *
     * @param {String} format The string of tokens
     * @param {Boolean} isUTC [OPTIONAL] Flag to return the date in UTC format
     * @returns The date formatted according to the provided format.
     *
     * Accepted pattern:
     *
     * dd - 2-digit day
     *
     * MM - 2-digit month
     *
     * MMM month with 3 letters
     *
     * yyyy - 4-digit year
     *
     * HH - 2 digit hour in 24-hour format
     *
     * hh - 2 digit hour in 12-hour format
     *
     * mm - minutes with 2 digits
     *
     * ss - 2-digit seconds
     *
     * ms - milliseconds
     *
     * tt - meridian
     */
    customFormat: (format: string, isUTC?: boolean) => string;
}
