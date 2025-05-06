import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'CustomDatePipe' })
export class CustomDatePipe implements PipeTransform {
    /**
     * Method to transform input value
     * @param type Type of transformation to carry out
     * @param value Actual value in context
     * @param args Additional args to support transformation
     * @returns any
     */
    transform(type: string, value: any, args: any[]): any {
        switch (type) {
            case 'formatReadableDateWithDotnetDate': {
                if (!value)
                    return {
                        date: 'NA',
                        time: 'NA'
                    };
                const inputDate = this.parseDate(value);
                const months = [
                    'January',
                    'February',
                    'March',
                    'April',
                    'May',
                    'June',
                    'July',
                    'August',
                    'September',
                    'October',
                    'November',
                    'December'
                ];
                const day = inputDate.getDate();
                const month = inputDate.getMonth();
                const year = inputDate.getFullYear();
                const hours = inputDate.getHours();
                const minutes = inputDate.getMinutes();

                const addOrdinalSuffix = (day) => {
                    if (day >= 11 && day <= 13) {
                        return day + 'th';
                    }
                    switch (day % 10) {
                        case 1:
                            return day + 'st';
                        case 2:
                            return day + 'nd';
                        case 3:
                            return day + 'rd';
                        default:
                            return day + 'th';
                    }
                };

                const period = hours >= 12 ? 'PM' : 'AM';
                const hours12 = hours % 12 || 12;

                return {
                    date: `${addOrdinalSuffix(day)} ${months[month]} ${year}`,
                    time: `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`
                };
            }
            case 'formatSinceWithDotnetDate': {
                if (!value) return '';
                const currentDate: any = new Date();
                let date: any = '';
                if (!value.includes('Date')) date = new Date(value);
                else date = this.parseDate(value);
                const diffMilliseconds = currentDate - date;

                const diffSeconds = Math.floor(diffMilliseconds / 1000);
                const diffMinutes = Math.floor(diffSeconds / 60);
                const diffHours = Math.floor(diffMinutes / 60);
                const diffDays = Math.floor(diffHours / 24);
                const diffWeeks = Math.floor(diffDays / 7);

                const currentMonth = currentDate.getMonth() + 1;
                const currentDateWithoutTime = new Date(currentDate.getFullYear(), currentMonth, 0);
                const dateWithoutTime = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                const diffMonths =
                    (currentDateWithoutTime.getFullYear() - dateWithoutTime.getFullYear()) * 12 +
                    (currentDateWithoutTime.getMonth() - dateWithoutTime.getMonth());

                if (diffSeconds < 60) {
                    return `${diffSeconds} s`;
                } else if (diffMinutes < 60) {
                    return `${diffMinutes} min${diffMinutes > 1 ? 's' : ''}`;
                } else if (diffHours < 24) {
                    return `${diffHours} hr${diffHours > 1 ? 's' : ''}`;
                } else if (diffDays < 7) {
                    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
                } else if (diffMonths < 12) {
                    return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''}`;
                } else {
                    return 'older';
                }
            }
        }
    }

    /**
     * Method to parse dotnet date to js format
     * @param dateToParse Dotnet date format
     */
    parseDate(dateToParse: string): Date | any {
        try {
            if (!dateToParse?.includes('Date')) {
                return new Date(dateToParse);
            } else {
                const regex = /\/Date\((\d+)\)\//;
                const match = dateToParse.match(regex);
                if (match && match.length > 1) {
                    const timestamp = parseInt(match[1], 10);
                    return new Date(timestamp);
                }
            }
            return new Date();
        } catch (error) {
            console.error(error);
        }
    }
}
