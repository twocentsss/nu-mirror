import { ViewMode } from "@/lib/store/platform-store";

export function formatISODate(date: Date) {
    return date.toISOString().slice(0, 10);
}

export function computeRange(mode: ViewMode, baseDate: Date) {
    const start = new Date(baseDate);
    const end = new Date(baseDate);

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    switch (mode) {
        case "DAY":
            break;
        case "WEEK":
            const dayOfWeek = start.getDay();
            start.setDate(start.getDate() - dayOfWeek);
            end.setDate(start.getDate() + 6);
            break;
        case "SPRINT":
            const currentDay = start.getDay();
            const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay;
            start.setDate(start.getDate() + daysToMonday);
            end.setDate(start.getDate() + 13);
            break;
        case "MONTH":
            start.setDate(1);
            end.setMonth(end.getMonth() + 1);
            end.setDate(0);
            break;
        case "QUARTER":
            const month = start.getMonth();
            const quarterStart = Math.floor(month / 3) * 3;
            start.setMonth(quarterStart);
            start.setDate(1);
            end.setMonth(quarterStart + 3);
            end.setDate(0);
            break;
    }

    return { start: formatISODate(start), end: formatISODate(end) };
}
