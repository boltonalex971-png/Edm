// HH:MM:SS-style relative-span renderer (e.g. "2d 3h 14m 5s").
export function dateToSpan(dateToConvert: Date | string | number | null | undefined): string {
    if (dateToConvert == null) return '';
    const dividerToSeconds = 1000;
    const now = new Date();
    const date = new Date(dateToConvert);
    const span = Math.abs(now.getTime() - date.getTime());
    const days = Math.floor(span / dividerToSeconds / 60 / 60 / 24);
    const hours = Math.floor(span / dividerToSeconds / 60 / 60 % 24);
    const minutes = Math.floor(span / dividerToSeconds / 60 % 60);
    const seconds = Math.floor(span / dividerToSeconds % 60);
    const sDays = days ? days + 'd ' : '';
    const sHours = hours || (days && (minutes || seconds)) ? hours + 'h ' : '';
    const sMinutes = minutes || ((days || hours) && seconds) ? minutes + 'm ' : '';
    const sSeconds = seconds ? seconds + 's' : '';

    return sDays + sHours + sMinutes + sSeconds;
}

// Human-readable relative span (e.g. "2 days ago", "an hour", "yesterday").
export function dateToHumanSpan(dateToConvert: Date | string | number | null | undefined): string {
    if (dateToConvert == null) return '';
    const dividerToSeconds = 1000;
    const now = new Date();
    const date = new Date(dateToConvert);
    const span = Math.abs(now.getTime() - date.getTime());
    const days = Math.floor(span / dividerToSeconds / 60 / 60 / 24);
    const hours = Math.floor(span / dividerToSeconds / 60 / 60 % 24);
    const minutes = Math.floor(span / dividerToSeconds / 60 % 60);
    const seconds = Math.floor(span / dividerToSeconds % 60);
    const result = (days && (days === 1 ? 'yesterday' : `${days} days`)) ||
        (hours && (hours === 1 ? 'an hour' : `${hours} hours`)) ||
        (minutes && (minutes === 1 ? 'a minute' : `${minutes} minutes`)) ||
        (seconds && (seconds === 1 ? 'a second' : `${seconds} seconds`)) ||
        'just now';

    return `${result}${days !== 1 ? ' ago' : ''}`;
}

// Convert a UTC ISO string (or Date) into a local-zone Date instance.
export function utcDateToLocal(utcDate: Date | string | undefined): Date | undefined {
    if (!utcDate) return undefined;
    const utc = new Date(utcDate);
    const offset = utc.getTimezoneOffset();
    return new Date(utc.getTime() - offset * 60 * 1000);
}
