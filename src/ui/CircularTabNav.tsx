"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

const TABS = [
    { id: "todo", label: "To-do", href: "/todo" },
    { id: "today", label: "Today", href: "/today" },
    { id: "focus", label: "Focus", href: "/focus" },
    { id: "me", label: "Me", href: "/me" },
];

export function CircularTabNav() {
    const router = useRouter();
    const pathname = usePathname();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    // Find current tab index
    const currentIndex = TABS.findIndex(t => pathname.startsWith(t.href));

    // Create infinite scroll by tripling the tabs
    const infiniteTabs = [...TABS, ...TABS, ...TABS];

    useEffect(() => {
        if (scrollRef.current) {
            // Center on the middle set
            const tabWidth = scrollRef.current.scrollWidth / infiniteTabs.length;
            scrollRef.current.scrollLeft = tabWidth * (TABS.length + currentIndex);
        }
    }, [currentIndex]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
        setScrollLeft(scrollRef.current?.scrollLeft || 0);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !scrollRef.current) return;
        e.preventDefault();
        const x = e.pageX - (scrollRef.current.offsetLeft || 0);
        const walk = (x - startX) * 2;
        scrollRef.current.scrollLeft = scrollLeft - walk;
    };

    const handleMouseUp = () => {
        if (!isDragging || !scrollRef.current) return;
        setIsDragging(false);

        // Snap to nearest tab
        const tabWidth = scrollRef.current.scrollWidth / infiniteTabs.length;
        const scrollPos = scrollRef.current.scrollLeft;
        const nearestIndex = Math.round(scrollPos / tabWidth);
        const targetTab = infiniteTabs[nearestIndex % TABS.length];

        // Smooth snap
        scrollRef.current.scrollTo({
            left: nearestIndex * tabWidth,
            behavior: "smooth"
        });

        // Navigate after snap
        setTimeout(() => {
            if (targetTab.href !== pathname) {
                router.push(targetTab.href);
            }
        }, 200);
    };

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const tabWidth = scrollRef.current.scrollWidth / infiniteTabs.length;
        const scrollPos = scrollRef.current.scrollLeft;

        // Loop around
        if (scrollPos < tabWidth * TABS.length * 0.5) {
            scrollRef.current.scrollLeft = scrollPos + tabWidth * TABS.length;
        } else if (scrollPos > tabWidth * TABS.length * 2.5) {
            scrollRef.current.scrollLeft = scrollPos - tabWidth * TABS.length;
        }
    };

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
            <div
                ref={scrollRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onScroll={handleScroll}
                className="flex overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing"
                style={{ scrollSnapType: "x mandatory" }}
            >
                {infiniteTabs.map((tab, i) => {
                    const isActive = tab.href === pathname;
                    return (
                        <div
                            key={`${tab.id}-${i}`}
                            className="flex-shrink-0 px-8 py-4 text-center"
                            style={{ scrollSnapAlign: "center", width: "33.333vw" }}
                        >
                            <div
                                className={`text-lg font-semibold transition-all duration-300 ${isActive
                                        ? "text-black scale-110"
                                        : "text-gray-400 scale-90"
                                    }`}
                            >
                                {tab.label}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
