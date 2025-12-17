"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Settings, Info } from "lucide-react";
import { useUIStore } from "@/lib/store/ui-store";
import { useState } from "react";
import AboutModal from "@/components/AboutModal";
import Link from "next/link";

export default function GlobalHeader() {
    const pathname = usePathname();
    const { isNavVisible } = useUIStore();
    const [showAbout, setShowAbout] = useState(false);

    // Don't show on Today page (it has its own custom header)
    if (pathname === "/today" || pathname === "/") return null;

    // Infer title from pathname
    const title = pathname?.split("/").pop() || "NuMirror";
    const displayTitle = title.charAt(0).toUpperCase() + title.slice(1);

    return (
        <>
            <motion.div
                initial={false}
                animate={{ y: isNavVisible ? 0 : -200, opacity: isNavVisible ? 1 : 0 }}
                transition={{ type: "spring", damping: 20, stiffness: 100 }}
                className="fixed top-0 left-0 right-0 z-40 pt-4 px-4 pb-4 bg-transparent pointer-events-none"
            >
                <div className="glass-panel rounded-3xl p-4 flex items-center justify-between pointer-events-auto shadow-2xl backdrop-blur-md max-w-7xl mx-auto w-full">

                    {/* Left: Title / Back */}
                    <div className="flex items-center gap-3">
                        {/* Optional: Add back button or icon if needed */}
                        <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
                            {displayTitle}
                        </h1>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex gap-2">
                        <div className="flex bg-[var(--glass-bg)] rounded-full border border-[var(--glass-border)] p-1 gap-1">
                            <button
                                onClick={() => alert("Search")}
                                className="p-1.5 rounded-full hover:bg-black/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                            >
                                <Search size={16} />
                            </button>
                            <button
                                onClick={() => alert("Settings")}
                                className="p-1.5 rounded-full hover:bg-black/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                            >
                                <Settings size={16} />
                            </button>
                            <button
                                onClick={() => setShowAbout(true)}
                                className="p-1.5 rounded-full hover:bg-black/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                            >
                                <Info size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>

            <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
        </>
    );
}
