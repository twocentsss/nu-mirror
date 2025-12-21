"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

export type SelectOption = {
    value: string | number;
    label: string;
};

interface CustomSelectProps {
    value: string | number | null;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    icon?: React.ReactNode;
    className?: string;
}

export function CustomSelect({
    value,
    onChange,
    options,
    placeholder = "Select...",
    icon,
    className = "",
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find((opt) => String(opt.value) === String(value));
    const isActive = value !== null && value !== "all";

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`h-9 flex items-center gap-2 px-4 rounded-xl transition-all border shadow-sm text-[10px] font-bold uppercase tracking-wider
          ${isActive
                        ? "bg-black text-white border-black"
                        : "bg-black/5 border-black/5 text-black/60 hover:bg-black/10 hover:text-black"
                    }
        `}
            >
                {icon && <span className={isActive ? "text-white" : "text-black/60"}>{icon}</span>}
                <span className="truncate max-w-[120px]">
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown size={12} className={`opacity-50 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 4, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        className="absolute top-full left-0 mt-1 min-w-[180px] max-h-[300px] overflow-y-auto bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-xl z-50 p-1 flex flex-col gap-0.5"
                    >
                        {options.map((option) => {
                            const isSelected = String(option.value) === String(value);
                            return (
                                <button
                                    key={option.value}
                                    onClick={() => {
                                        onChange(String(option.value));
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors
                    ${isSelected
                                            ? "bg-black text-white"
                                            : "text-black/60 hover:bg-black/5 hover:text-black"
                                        }
                  `}
                                >
                                    {option.label}
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
