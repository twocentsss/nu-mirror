"use client";

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Calendar as CalendarIcon, Clock, ChevronDown } from 'lucide-react';
import { format, parseISO, setDate, setHours, setMinutes, setMonth, setYear, isValid } from 'date-fns';

export const LOCAL_DATETIME_FORMAT = "yyyy-MM-dd'T'HH:mm";

export function formatLocalDateTime(date: Date) {
    return format(date, LOCAL_DATETIME_FORMAT);
}

export function normalizeDateTimeValue(raw?: string) {
    if (!raw) return "";
    const parsed = parseISO(raw);
    return isValid(parsed) ? formatLocalDateTime(parsed) : "";
}

interface WheelPickerProps {
    items: (string | number)[];
    value: string | number;
    onChange: (value: string | number) => void;
    label?: string;
}

/**
 * A highly stable, snap-based Wheel Picker component.
 * Uses standard CSS scroll with snap-y for maximum predictability.
 */
export function WheelPicker({ items, value, onChange, label }: WheelPickerProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const ITEM_HEIGHT = 28;
    const [scrollTop, setScrollTop] = useState(0);
    const isInternalUpdate = useRef(false);

    // Sync scroll position with value (one-way from value to scroll)
    useEffect(() => {
        if (isInternalUpdate.current) {
            isInternalUpdate.current = false;
            return;
        }
        const index = items.indexOf(value);
        if (index !== -1 && scrollRef.current) {
            scrollRef.current.scrollTop = index * ITEM_HEIGHT;
        }
    }, [value, items, ITEM_HEIGHT]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const top = e.currentTarget.scrollTop;
        setScrollTop(top);

        const index = Math.round(top / ITEM_HEIGHT);
        if (index >= 0 && index < items.length) {
            const newValue = items[index];
            if (newValue !== value) {
                isInternalUpdate.current = true;
                onChange(newValue);
            }
        }
    };

    return (
        <div className="flex flex-col items-center flex-1 min-w-[36px]">
            {label && <span className="text-[7px] font-black text-white/20 uppercase tracking-[0.2em] mb-1.5">{label}</span>}
            <div className="h-[100px] w-full relative overflow-hidden bg-white/[0.03] rounded-xl border border-white/5 group shadow-inner">
                {/* Selection Highlight */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[28px] bg-white/10 border-y border-white/10 pointer-events-none z-10" />

                {/* Visual Depth Masks */}
                <div className="absolute inset-0 pointer-events-none z-20 bg-gradient-to-b from-[#0a0a0a] via-transparent to-[#0a0a0a] opacity-80" />

                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide py-[36px]"
                    style={{ scrollBehavior: 'auto' }} // Snap-y works best with 'auto' for precise wheel feels
                >
                    {items.map((item, i) => {
                        const itemY = i * ITEM_HEIGHT;
                        const distance = Math.abs(scrollTop - itemY);
                        const opacity = Math.max(0.2, 1 - (distance / (ITEM_HEIGHT * 2.5)));
                        const scale = Math.max(0.85, 1 - (distance / (ITEM_HEIGHT * 6)));
                        const rotateX = (itemY - scrollTop) / ITEM_HEIGHT * 25;

                        return (
                            <div
                                key={`${item}-${i}`}
                                className="h-[28px] flex items-center justify-center snap-center"
                                style={{
                                    opacity,
                                    transform: `perspective(1000px) rotateX(${rotateX}deg) scale(${scale})`,
                                }}
                            >
                                <span className={`text-[10px] font-black tabular-nums tracking-tighter ${value === item ? 'text-white' : 'text-white/40'}`}>
                                    {item}
                                </span>
                            </div>
                        );
                    })}
                    <div className="h-[36px]" />
                </div>
            </div>
        </div>
    );
}

/**
 * DateTimeWheelPicker Powered by date-fns.
 * Provides a robust, predictable date/time selection interface.
 */
export function DateTimeWheelPicker({ value, onChange }: { value: string, onChange: (val: string) => void }) {
    const nativeRef = useRef<HTMLInputElement>(null);

    const normalizedValue = useMemo(() => normalizeDateTimeValue(value), [value]);

    // Always parse from string to ensure no reference issues
    const date = useMemo(() => {
        const parsed = parseISO(normalizedValue);
        return isValid(parsed) ? parsed : new Date();
    }, [normalizedValue]);

    const years = useMemo(() => {
        const current = new Date().getFullYear();
        return Array.from({ length: 11 }, (_, i) => current - 2 + i);
    }, []);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const days = useMemo(() => {
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        return Array.from({ length: lastDay }, (_, i) => i + 1);
    }, [date.getFullYear(), date.getMonth()]);

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    const updateDate = (type: 'year' | 'month' | 'day' | 'hour' | 'minute', val: any) => {
        let newDate = new Date(date);

        switch (type) {
            case 'year': newDate = setYear(newDate, Number(val)); break;
            case 'month': newDate = setMonth(newDate, months.indexOf(val)); break;
            case 'day': newDate = setDate(newDate, Number(val)); break;
            case 'hour': newDate = setHours(newDate, Number(val)); break;
            case 'minute': newDate = setMinutes(newDate, Number(val)); break;
        }

        // Emit consistently as local ISO string (minute precision)
        onChange(formatLocalDateTime(newDate));
    };

    return (
        <div className="flex flex-col gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
            {/* Header: Display and Mode toggle */}
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                        <CalendarIcon size={10} className="text-white/20" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Schedule</span>
                    </div>
                    <span className="text-[11px] font-bold text-white tracking-tight">
                        {format(date, 'EEE, MMM d • h:mm a')}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onChange(formatLocalDateTime(new Date()))}
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white text-[9px] font-black text-white hover:text-black transition-all flex items-center justify-center uppercase tracking-widest"
                    >
                        Now
                    </button>
                    <button
                        onClick={() => nativeRef.current?.showPicker()}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all flex items-center justify-center border border-white/5"
                    >
                        <ChevronDown size={14} />
                    </button>
                    <input
                        ref={nativeRef}
                        type="datetime-local"
                        className="absolute opacity-0 pointer-events-none w-0 h-0"
                        value={normalizedValue}
                        onChange={(e) => onChange(e.target.value)}
                    />
                </div>
            </div>

            {/* The Wheel Interface */}
            <div className="flex gap-1.5 w-full">
                <WheelPicker
                    label="DD"
                    items={days}
                    value={date.getDate()}
                    onChange={(v) => updateDate('day', v)}
                />
                <WheelPicker
                    label="MM"
                    items={months}
                    value={months[date.getMonth()]}
                    onChange={(v) => updateDate('month', v)}
                />
                <WheelPicker
                    label="YYYY"
                    items={years}
                    value={date.getFullYear()}
                    onChange={(v) => updateDate('year', v)}
                />
                <div className="w-1" />
                <WheelPicker
                    label="HR"
                    items={hours}
                    value={date.getHours()}
                    onChange={(v) => updateDate('hour', v)}
                />
                <WheelPicker
                    label="MIN"
                    items={minutes}
                    value={date.getMinutes()}
                    onChange={(v) => updateDate('minute', v)}
                />
            </div>
        </div>
    );
}
