"use client";

import { ReactNode, useEffect, useState } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { useDockStore, DockPosition } from "@/lib/store/dock-store";
import { useUIStore } from "@/lib/store/ui-store";

interface DockBarProps {
    position: DockPosition;
    children: ReactNode;
    label?: string; // Content to show on the peaked handle when collapsed
    labelSecondary?: string; // Secondary label for split layouts (e.g. Dashboard Brow)
    className?: string;
}

const getStyles = (position: DockPosition) => {
    const base = "fixed z-50 bg-[var(--dock-bg)] backdrop-blur-3xl border-[var(--glass-border)] shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all duration-500 flex flex-col";

    switch (position) {
        case 'top':
            return `${base} top-0 left-0 right-0 border-b rounded-b-[40px]`;
        case 'bottom':
            return `${base} bottom-0 left-0 right-0 border-t rounded-t-[40px] safe-bottom`;
        case 'left':
            return `${base} left-0 top-0 bottom-0 border-r rounded-r-[40px] w-fit h-full flex-row`;
        case 'right':
            return `${base} right-0 top-0 bottom-0 border-l rounded-l-[40px] w-fit h-full flex-row`;
    }
};

export default function DockBar({ position, children, label, labelSecondary, className = "" }: DockBarProps) {
    const { visibility, toggleDock } = useDockStore();
    const { isNavVisible, setNavVisible } = useUIStore();

    const handleToggle = (pos: DockPosition) => {
        setNavVisible(true);
        toggleDock(pos);
    };
    const isVisible = visibility[position];
    const controls = useAnimation();

    // The "Shutter" logic: Hidden means mostly off-screen, peaked by 24px
    // Also reacts to the global isNavVisible (learn from old doc)
    const isActuallyVisible = isVisible && isNavVisible;

    // Lag state for labels to sync with spring movement
    const [isPeaked, setIsPeaked] = useState(!isActuallyVisible);

    useEffect(() => {
        // Absolute strings for Framer Motion calc handling
        let offset = isActuallyVisible ? "0%" : (
            position === 'top' || position === 'left' ? "calc(-100% + 24px)" : "calc(100% - 24px)"
        );

        // Special case: Top dock only closes 75% (stays 25% visible)
        if (!isActuallyVisible && position === 'top') {
            offset = "-75%";
        }

        controls.start({
            x: (position === 'left' || position === 'right') ? offset : 0,
            y: (position === 'top' || position === 'bottom') ? offset : 0,
            opacity: 1,
            transition: { type: "spring", damping: 25, stiffness: 200 }
        });

        // Sync labels with movement to prevent "early" appearance/disappearance
        const timer = setTimeout(() => {
            setIsPeaked(!isActuallyVisible);
        }, isActuallyVisible ? 100 : 450); // Closing (to Peaked) takes longer than Opening

        return () => clearTimeout(timer);
    }, [isActuallyVisible, position, controls]);

    // Inactivity Nudge Logic
    useEffect(() => {
        let timer: NodeJS.Timeout;

        const triggerNudge = () => {
            const nudgeOffset = 16; // Distinct 16px move

            // Inward directions: Top (+y), Left (+x), Bottom (-y), Right (-x)
            const inwardDir = (position === 'top' || position === 'left') ? 1 : -1;

            // If open (visible), move OUT. If closed (peaked), move IN.
            const direction = isActuallyVisible ? -inwardDir : inwardDir;

            const axis = (position === 'top' || position === 'bottom') ? 'y' : 'x';

            let baseOffset = isActuallyVisible ? "0%" : (
                position === 'top' || position === 'left' ? "calc(-100% + 24px)" : "calc(100% - 24px)"
            );

            // Respect the top dock's 75% closed state
            if (!isActuallyVisible && position === 'top') {
                baseOffset = "-75%";
            }

            const nudgeVal = `${direction * nudgeOffset}px`;

            controls.start({
                [axis]: [baseOffset, `calc(${baseOffset} + ${nudgeVal})`, baseOffset],
                transition: { duration: 1.5, times: [0, 0.4, 1], ease: "easeInOut" }
            } as any);
        };

        const resetTimer = () => {
            clearTimeout(timer);
            timer = setTimeout(triggerNudge, 10000); // 10s inactivity
        };

        // Listen for ANY activity
        const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
        events.forEach(e => window.addEventListener(e, resetTimer));

        resetTimer();

        return () => {
            events.forEach(e => window.removeEventListener(e, resetTimer));
            clearTimeout(timer);
        };
    }, [isActuallyVisible, position, controls]);

    const isHorizontal = position === 'top' || position === 'bottom';
    const handleClasses = isHorizontal
        ? "w-full h-8 flex flex-col justify-center items-center cursor-pointer pointer-events-auto group relative px-4"
        : "h-full w-8 flex flex-row justify-center items-center cursor-pointer pointer-events-auto group relative py-4";

    const pillClasses = isHorizontal
        ? "w-16 h-1 rounded-full bg-white/10 group-hover:bg-blue-500/50 shadow-[0_0_10px_rgba(255,255,255,0.05)] transition-all duration-500 group-hover:w-24"
        : "h-16 w-1 rounded-full bg-white/10 group-hover:bg-blue-500/50 shadow-[0_0_10px_rgba(255,255,255,0.05)] transition-all duration-500 group-hover:h-24";

    const labelClasses = isHorizontal
        ? "text-[10px] font-black uppercase tracking-[0.6em] text-white/40 mb-2 group-hover:text-blue-400/80 transition-all duration-500"
        : "text-[10px] font-black uppercase tracking-[0.6em] text-white/40 ml-2 group-hover:text-blue-400/80 transition-all duration-500 [writing-mode:vertical-lr]";

    return (
        <motion.div
            initial={false}
            animate={controls}
            className={`${getStyles(position)} ${className} pointer-events-none`}
        >
            {/* Dashboard Brow (Peaked state for Top Dock) */}
            <AnimatePresence>
                {position === 'top' && isPeaked && !isActuallyVisible && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-0 left-0 right-0 h-[25%] flex items-center justify-between pointer-events-none px-12"
                    >
                        <motion.span
                            initial={{ x: 100, opacity: 0, filter: "blur(10px)" }}
                            animate={{ x: 0, opacity: 0.8, filter: "blur(0px)" }}
                            exit={{ x: 100, opacity: 0, filter: "blur(10px)" }}
                            transition={{ type: "spring", damping: 30, stiffness: 100 }}
                            className="text-xl font-black tracking-tight text-[var(--text-primary)] whitespace-nowrap"
                        >
                            {label}
                        </motion.span>
                        {labelSecondary && (
                            <motion.span
                                initial={{ x: -100, opacity: 0, filter: "blur(10px)" }}
                                animate={{ x: 0, opacity: 0.8, filter: "blur(0px)" }}
                                exit={{ x: -100, opacity: 0, filter: "blur(10px)" }}
                                transition={{ type: "spring", damping: 30, stiffness: 100 }}
                                className="text-xl font-black tracking-tight text-[var(--text-primary)] whitespace-nowrap"
                            >
                                {labelSecondary}
                            </motion.span>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Handle - Top/Left edge positioning */}
            {(position === 'bottom' || position === 'right') && (
                <div onClick={() => handleToggle(position)} className={handleClasses}>
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
                <div onClick={() => handleToggle(position)} className={handleClasses}>
                    <div className={pillClasses} />
                    {!isActuallyVisible && label && position !== 'top' && <span className={isHorizontal ? 'mt-1 ' + labelClasses : 'mr-1 ' + labelClasses}>{label}</span>}
                    <div className="absolute inset-0 bg-[var(--accent-color)] opacity-0 group-hover:opacity-10 blur-xl rounded-full transition-opacity" />
                    <motion.div whileTap={{ scale: 0.9 }} className="absolute inset-0" />
                </div>
            )}
        </motion.div>
    );
}
