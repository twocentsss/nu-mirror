"use client";

import { useRef, useState, useEffect, useCallback } from "react";

type CircularDatePickerProps = {
    selectedDate: Date;
    onDateChange: (date: Date) => void;
};

export function CircularDatePicker({ selectedDate, onDateChange }: CircularDatePickerProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

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

    useEffect(() => {
        if (scrollRef.current) {
            const dayWidth = scrollRef.current.scrollWidth / infiniteDates.length;
            const centerIndex = baseDates.length + 60;
            scrollRef.current.scrollLeft = dayWidth * centerIndex;
        }
    }, [selectedDate]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
        setScrollLeft(scrollRef.current?.scrollLeft || 0);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true);
        setStartX(e.touches[0].pageX - (scrollRef.current?.offsetLeft || 0));
        setScrollLeft(scrollRef.current?.scrollLeft || 0);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !scrollRef.current) return;
        e.preventDefault();
        const x = e.pageX - (scrollRef.current.offsetLeft || 0);
        const walk = (x - startX) * 2;
        scrollRef.current.scrollLeft = scrollLeft - walk;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging || !scrollRef.current) return;
        const x = e.touches[0].pageX - (scrollRef.current.offsetLeft || 0);
        const walk = (x - startX) * 2;
        scrollRef.current.scrollLeft = scrollLeft - walk;
    };

    const handleMouseUp = () => {
        if (!isDragging || !scrollRef.current) return;
        setIsDragging(false);

        const dayWidth = scrollRef.current.scrollWidth / infiniteDates.length;
        const scrollPos = scrollRef.current.scrollLeft;
        const nearestIndex = Math.round(scrollPos / dayWidth);
        const targetDate = infiniteDates[nearestIndex];

        scrollRef.current.scrollTo({
            left: nearestIndex * dayWidth,
            behavior: "smooth"
        });

        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }

        scrollTimeoutRef.current = setTimeout(() => {
            if (targetDate.toDateString() !== selectedDate.toDateString()) {
                onDateChange(targetDate);
            }
        }, 300);
    };

    const handleDateClick = (date: Date) => {
        if (date.toDateString() === selectedDate.toDateString()) return;
        onDateChange(date);
    };

    const handleScroll = () => {
        if (!scrollRef.current || isDragging) return;
        const dayWidth = scrollRef.current.scrollWidth / infiniteDates.length;
        const scrollPos = scrollRef.current.scrollLeft;

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
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
            onScroll={handleScroll}
            className="flex overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing py-4"
            style={{ scrollSnapType: "x mandatory" }}
        >
            {infiniteDates.map((date, i) => {
                const { day, dayName } = formatDate(date);
                const selected = isSelected(date);
                const today = isToday(date);

                return (
                    <div
                        key={`${date.toISOString()}-${i}`}
                        onClick={() => handleDateClick(date)}
                        className="flex-shrink-0 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer"
                        style={{
                            scrollSnapAlign: "center",
                            width: "14.28vw",
                            transform: selected ? "scale(1.2)" : "scale(0.85)",
                            opacity: selected ? 1 : 0.4
                        }}
                    >
                        <div className={`text-xs font-bold uppercase tracking-wider ${selected ? 'text-black' : 'text-gray-400'}`}>
                            {dayName}
                        </div>
                        <div className={`text-2xl font-bold mt-1 ${selected ? 'text-black' : 'text-gray-300'} ${today ? 'relative' : ''}`}>
                            {day}
                            {today && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500" />}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
