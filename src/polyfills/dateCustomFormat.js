if (!Date.prototype.customFormat) {
    /**
     * Prototype function for "Date" that takes a string "format" as a parameter and optional parameter "isUTC".
     * Return the date formatted according to the provided format.
     *
     * Being:
     * dd - 2-digit day
     * MM - 2-digit month
     * MMM month with 3 letters
     * yyyy - 4-digit year
     * HH - 2 digit hour in 24-hour format
     * hh - 2 digit hour in 12-hour format
     * mm - minutes with 2 digits
     * ss - 2-digit seconds
     * ms - milliseconds
     * tt - meridian
     */
    Date.prototype.customFormat = function (format, isUTC = false) {
        try {
            const validate = (value) => {
                return value < 10 ? `0${value}` : value;
            };

            let yyyy;
            let MM;
            let MMM;
            let dd;
            let HH;
            let hh;
            let mm;
            let ss;
            let ms;
            let tt;

            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

            // check to take time in UTC
            if (isUTC) {
                const date = new Date()
                    .toISOString()
                    .replaceAll('-', '')
                    .replaceAll(':', '')
                    .replaceAll('.', '')
                    .replaceAll('T', '')
                    .replaceAll('Z', '');

                yyyy = date.slice(0, 4);
                MM = date.slice(4, 6);
                MMM = months[Number(MM) - 1];
                dd = date.slice(6, 8);
                HH = date.slice(8, 10);
                const hours = Number(HH);
                hh = hours === '00' ? 12 : hours > 12 ? hours - 12 : hours;
                mm = date.slice(10, 12);
                ss = date.slice(12, 14);
                ms = date.slice(14, 17);
                tt = hours / 12 >= 1 ? 'pm' : 'am';
            } else {
                yyyy = this.getFullYear();
                MM = validate(this.getMonth() + 1);
                MMM = months[this.getMonth()];
                dd = validate(this.getDate());
                const hours = this.getHours();
                HH = validate(hours);
                hh = this.getHours() === 0 ? 12 : hours > 12 ? hours - 12 : hours;
                mm = validate(this.getMinutes());
                ss = validate(this.getSeconds());
                ms = validate(this.getMilliseconds());
                tt = hours / 12 >= 1 ? 'pm' : 'am';
            }

            return format
                .replace('dd', dd)
                .replace('MMM', MMM)
                .replace('MM', MM)
                .replace('yyyy', yyyy)
                .replace('HH', HH)
                .replace('hh', hh)
                .replace('mm', mm)
                .replace('ss', ss)
                .replace('ms', ms)
                .replace('tt', tt)
                .replace('TT', tt.toUpperCase());
        } catch (e) {
            console.error(e);
            return 'Invalid Date';
        }
    };
}
