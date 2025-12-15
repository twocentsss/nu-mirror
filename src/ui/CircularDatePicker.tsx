"use client";

import { useRef, useState, useEffect, useCallback } from "react";

type CircularDatePickerProps = {
    selectedDate: Date;
    onDateChange: (date: Date) => void;
};

export function CircularDatePicker({ selectedDate, onDateChange }: CircularDatePickerProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    // Use Framer Motion x value for dragging
    const x = useMotionValue(0);
    const [isDragging, setIsDragging] = useState(false);

    const generateDates = useCallback(() => {
        const dates = [];
        const base = new Date(selectedDate);
        base.setHours(0, 0, 0, 0);

        for (let i = -60; i <= 60; i++) {
            const d = new Date(base);
            d.setDate(base.getDate() + i);
            dates.push(d);
        }
        return dates;
    }, [selectedDate]);

    const baseDates = generateDates();
    const infiniteDates = [...baseDates, ...baseDates, ...baseDates];

    // Center on mount/update - simplified
    useEffect(() => {
        if (scrollRef.current) {
            const dayWidth = scrollRef.current.scrollWidth / infiniteDates.length;
            const centerIndex = baseDates.length + 60; // Approximate center
            scrollRef.current.scrollLeft = dayWidth * centerIndex;
        }
    }, [selectedDate]); // Re-center on date change

    // Handle scroll for infinite effect (native scroll)
    const handleScroll = () => {
        if (!scrollRef.current) return;
        const dayWidth = scrollRef.current.scrollWidth / infiniteDates.length;
        const scrollPos = scrollRef.current.scrollLeft;

        // Infinite loop logic
        if (scrollPos < dayWidth * baseDates.length * 0.5) {
            scrollRef.current.scrollLeft = scrollPos + dayWidth * baseDates.length;
        } else if (scrollPos > dayWidth * baseDates.length * 2.5) {
            scrollRef.current.scrollLeft = scrollPos - dayWidth * baseDates.length;
        }
    };

    const formatDate = (date: Date) => {
        const day = date.getDate();
        const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
        return { day, dayName };
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isSelected = (date: Date) => {
        return date.toDateString() === selectedDate.toDateString();
    };

    return (
        <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing py-4 select-none touch-pan-x"
            style={{
                scrollSnapType: "x mandatory",
                WebkitOverflowScrolling: "touch"
            }}
        >
            {infiniteDates.map((date, i) => {
                const { day, dayName } = formatDate(date);
                const selected = isSelected(date);
                const today = isToday(date);

                return (
                    <motion.div
                        key={`${date.toISOString()}-${i}`}
                        // Use onTap for mobile compatibility
                        onTap={() => {
                            // Simple fallback: If native scrolling, we just click.
                            // Browser handles distinction between scroll and click usually.
                            onDateChange(date);
                        }}
                        className="flex-shrink-0 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer"
                        style={{
                            scrollSnapAlign: "center",
                            width: "14.28vw",
                            transform: selected ? "scale(1.2)" : "scale(0.85)",
                            opacity: selected ? 1 : 0.4
                        }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <div className={`text-xs font-bold uppercase tracking-wider ${selected ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                            {dayName}
                        </div>
                        <div className={`text-2xl font-bold mt-1 ${selected ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'} ${today ? 'relative' : ''}`}>
                            {day}
                            {today && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[var(--accent-color)] shadow-sm" />}
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}

// Helper to use MotionValue (not strictly needed if we use native scroll with snap, 
// but sticking to native scroll with Framer Tap is safer for hybrid.)
import { motion, useMotionValue } from "framer-motion";
