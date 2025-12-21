"use client";

import { motion, useDragControls } from "framer-motion";
import { Plus } from "lucide-react";
import { ReactNode, useState } from "react";

export default function SwipeToCreate({
    onTrigger,
    children,
}: {
    onTrigger: () => void;
    children: ReactNode;
}) {
    const [pullY, setPullY] = useState(0);
    const threshold = 150;

    return (
        <div
            className="relative min-h-screen"
            onTouchStart={(e) => {
                // Simple touch tracking if needed, but framer motion drag on a specific handler is safer
                // preventing conflicts with scroll is hard.
                // We will use a dedicated "pull area" at the very top.
            }}
        >
            {/* Pull Indicator */}
            <motion.div
                className="fixed top-0 left-0 right-0 flex justify-center items-center pointer-events-none z-40"
                style={{ height: pullY, opacity: pullY / threshold }}
            >
                <div className="bg-black/80 text-white rounded-full p-2 shadow-xl flex items-center gap-2">
                    <Plus size={24} />
                    <span className="font-bold text-sm">New</span>
                </div>
            </motion.div>

            {/* Logic Wrapper */}
            {/* We need a "pullable" container. Or a listener.
          A simple way: if scroll is at 0, and dragging down.
          Let's try a transparent overlay at top 50px that accepts dragging?
      */}
            <motion.div
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.2}
                onDrag={(_, info) => {
                    if (info.offset.y > 0) setPullY(info.offset.y);
                }}
                onDragEnd={(_, info) => {
                    if (info.offset.y > threshold) {
                        onTrigger();
                    }
                    setPullY(0);
                }}
                className="absolute top-0 left-0 right-0 h-8 z-30 cursor-grab active:cursor-grabbing"
            />

            {children}
        </div>
    );
}
