
export const getEndOfDay = (dateStr: string): Date => {
    // Expects YYYY-MM-DD
    const [y, m, d] = dateStr.split('-').map(Number);
    // Note: Month is 0-indexed in JS Date
    return new Date(y, m - 1, d, 23, 59, 59, 999);
};

export const getStartOfDay = (dateStr: string): Date => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d, 0, 0, 0, 0);
};

export const getDurationDays = (start: string, end: string): number => {
    const s = getStartOfDay(start);
    const e = getEndOfDay(end);
    // Add 1ms to make it full range, then ceil?
    // Actually simplicity: inclusive days.
    // If Feb 11 to Feb 11. Diff is almost 24h. 1 Day.
    // If Feb 11 to Feb 17. Diff is 6d 23h 59m.
    const diff = e.getTime() - s.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const getTimeLeftString = (endDateStr: string): string => {
    const now = new Date().getTime();
    const end = getEndOfDay(endDateStr).getTime();

    const diff = end - now;
    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    // If < 24h, show hours and minutes
    if (days === 0) return `${hours}h ${minutes}m`;

    return `${days}d ${hours}h`;
};

export const addDays = (dateStr: string, days: number): string => {
    const date = getStartOfDay(dateStr);
    date.setDate(date.getDate() + days);
    return date.getFullYear() + '-' +
        String(date.getMonth() + 1).padStart(2, '0') + '-' +
        String(date.getDate()).padStart(2, '0');
};
