"use client";

import { useScroll, useMotionValueEvent } from "framer-motion";
import { useRef, useState } from "react";
import { useUIStore } from "@/lib/store/ui-store";

interface ScrollAwareLayoutProps {
    children: React.ReactNode;
    className?: string;
}

export default function ScrollAwareLayout({ children, className = "" }: ScrollAwareLayoutProps) {
    const { setNavVisible } = useUIStore();
    const [lastY, setLastY] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // We use useScroll without a ref to track window scroll, 
    // or pass a ref if we want to track specific container.
    // For main page scroll, tracking window (default) or body is usually best.
    // But since we have a specific layout structure, let's try tracking the container.
    const { scrollY } = useScroll({ container: containerRef });

    useMotionValueEvent(scrollY, "change", (latest) => {
        const diff = latest - lastY;

        // Threshold to avoid jitter
        if (Math.abs(diff) > 10) {
            if (diff > 0) {
                // Scrolling Down -> Hide
                setNavVisible(false);
            } else {
                // Scrolling Up -> Show
                setNavVisible(true);
            }
            setLastY(latest);
        }
    });

    return (
        <div
            ref={containerRef}
            className={`h-screen overflow-y-auto scrollbar-hide snap-y snap-mandatory overscroll-y-contain touch-pan-y ${className}`}
        >
            {children}
        </div>
    );
}
