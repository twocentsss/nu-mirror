"use client";

import { ReactNode, useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import { useDockStore, DockPosition } from "@/lib/store/dock-store";
import { useUIStore } from "@/lib/store/ui-store";

interface DockBarProps {
    position: DockPosition;
    children: ReactNode;
    label?: string; // Content to show on the peaked handle when collapsed
    className?: string;
}

const getStyles = (position: DockPosition) => {
    const base = "fixed z-50 bg-[var(--dock-bg)] backdrop-blur-xl border-[var(--glass-border)] shadow-2xl transition-colors duration-500 flex flex-col";

    switch (position) {
        case 'top':
            return `${base} top-0 left-0 right-0 border-b rounded-b-[32px]`;
        case 'bottom':
            return `${base} bottom-0 left-0 right-0 border-t rounded-t-[32px] safe-bottom`;
        case 'left':
            return `${base} left-0 top-0 bottom-0 border-r rounded-r-[32px] w-fit h-full flex-row`;
        case 'right':
            return `${base} right-0 top-0 bottom-0 border-l rounded-l-[32px] w-fit h-full flex-row`;
    }
};

export default function DockBar({ position, children, label, className = "" }: DockBarProps) {
    const { visibility, toggleDock } = useDockStore();
    const { isNavVisible } = useUIStore();
    const isVisible = visibility[position];
    const controls = useAnimation();

    // The "Shutter" logic: Hidden means mostly off-screen, peaked by 24px
    // Also reacts to the global isNavVisible (learn from old doc)
    const isActuallyVisible = isVisible && isNavVisible;

    useEffect(() => {
        // We use absolute strings for better Framer Motion calc handling
        const offset = isActuallyVisible ? "0%" : (
            position === 'top' || position === 'left' ? "calc(-100% + 24px)" : "calc(100% - 24px)"
        );

        controls.start({
            x: (position === 'left' || position === 'right') ? offset : 0,
            y: (position === 'top' || position === 'bottom') ? offset : 0,
            opacity: 1,
            transition: { type: "spring", damping: 25, stiffness: 200 }
        });
    }, [isActuallyVisible, position, controls]);

    const isHorizontal = position === 'top' || position === 'bottom';
    const handleClasses = isHorizontal
        ? "w-full h-8 flex flex-col justify-center items-center cursor-pointer pointer-events-auto group relative px-4"
        : "h-full w-8 flex flex-row justify-center items-center cursor-pointer pointer-events-auto group relative py-4";

    const pillClasses = isHorizontal
        ? "w-12 h-1.5 rounded-full bg-gray-400/40 group-hover:bg-[var(--accent-color)] transition-all duration-300"
        : "h-12 w-1.5 rounded-full bg-gray-400/40 group-hover:bg-[var(--accent-color)] transition-all duration-300";

    const labelClasses = isHorizontal
        ? "text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-1 opacity-50 group-hover:opacity-100 transition-opacity"
        : "text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1 opacity-50 group-hover:opacity-100 transition-opacity [writing-mode:vertical-lr]";

    return (
        <motion.div
            initial={false}
            animate={controls}
            className={`${getStyles(position)} ${className} pointer-events-none`}
        >
            {/* Handle - Top/Left edge positioning */}
            {(position === 'bottom' || position === 'right') && (
                <div onClick={() => toggleDock(position)} className={handleClasses}>
                    {!isActuallyVisible && label && <span className={labelClasses}>{label}</span>}
                    <div className={pillClasses} />
                    <div className="absolute inset-0 bg-[var(--accent-color)] opacity-0 group-hover:opacity-10 blur-xl rounded-full transition-opacity" />
                    <motion.div whileTap={{ scale: 0.9 }} className="absolute inset-0" />
                </div>
            )}

            {/* Content Area */}
            <div className={`pointer-events-auto flex-1 overflow-auto scrollbar-hide ${isVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
                {children}
            </div>

            {/* Handle - Bottom/Right edge positioning */}
            {(position === 'top' || position === 'left') && (
                <div onClick={() => toggleDock(position)} className={handleClasses}>
                    <div className={pillClasses} />
                    {!isActuallyVisible && label && <span className={isHorizontal ? 'mt-1 ' + labelClasses : 'mr-1 ' + labelClasses}>{label}</span>}
                    <div className="absolute inset-0 bg-[var(--accent-color)] opacity-0 group-hover:opacity-10 blur-xl rounded-full transition-opacity" />
                    <motion.div whileTap={{ scale: 0.9 }} className="absolute inset-0" />
                </div>
            )}
        </motion.div>
    );
}
