"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

export type BottomNavItem = {
    id: string;
    label: string;
    href: string;
    icon: React.ReactNode;
    available: boolean;
};

export const ITEMS: BottomNavItem[] = [
    { id: "todo", label: "To-do", href: "/todo", available: true, icon: <IconCheckSquare /> },
    { id: "today", label: "Today", href: "/today", available: true, icon: <IconCalendar /> },
    { id: "focus", label: "Focus", href: "/focus", available: true, icon: <IconFocus /> },
    { id: "me", label: "Me", href: "/me", available: true, icon: <IconFace /> },
    { id: "protocol", label: "Protocol", href: "/protocol", available: true, icon: <IconFingerprint /> },
    { id: "stories", label: "Stories", href: "/stories", available: true, icon: <IconBookOpen /> },
    { id: "comics", label: "Comics", href: "/comics", available: true, icon: <IconImage /> },
    { id: "bingo", label: "Bingo", href: "/bingo", available: true, icon: <IconGrid /> },
    { id: "sprint", label: "Sprint", href: "/sprint", available: true, icon: <IconRun /> },
    { id: "assist", label: "Assist", href: "/assistance", available: true, icon: <IconBot /> },
    { id: "reports", label: "Reports", href: "/reports", available: true, icon: <IconChart /> },
    { id: "games", label: "Games", href: "/games", available: true, icon: <IconGamepad /> },
    { id: "social", label: "Social", href: "/social", available: true, icon: <IconUsers /> },
    { id: "learning", label: "Learn", href: "/learning", available: true, icon: <IconGraduationCap /> },
    { id: "business", label: "Business", href: "/business", available: true, icon: <IconBriefcase /> },
    { id: "selling", label: "Sell", href: "/selling", available: true, icon: <IconTag /> },
    { id: "buying", label: "Buy", href: "/buying", available: true, icon: <IconShoppingBag /> },
    { id: "stores", label: "Store", href: "/stores", available: true, icon: <IconStore /> },
    { id: "chat", label: "Chat", href: "/chat", available: true, icon: <IconMessageCircle /> },
];

function IconCheckSquare() { return <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 12l2 2 4-4" /></svg>; }
function IconCalendar() { return <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>; }
function IconFocus() { return <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M12 1v6m0 6v6M1 12h6m6 0h6" /></svg>; }
function IconFace() { return <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>; }
function IconBookOpen() { return <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>; }
function IconImage() { return <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>; }
function IconGrid() { return <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>; }
function IconRun() { return <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 17l6-6 4 6 6-6" /></svg>; }
function IconBot() { return <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="16" x2="8" y2="16" /><line x1="16" y1="16" x2="16" y2="16" /></svg>; }
function IconChart() { return <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>; }
function IconGamepad() { return <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="6" y1="12" x2="10" y2="12" /><line x1="8" y1="10" x2="8" y2="14" /><line x1="15" y1="13" x2="15.01" y2="13" /><line x1="18" y1="11" x2="18.01" y2="11" /><rect x="2" y="6" width="20" height="12" rx="2" /></svg>; }
function IconUsers() { return <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>; }
function IconGraduationCap() { return <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>; }
function IconBriefcase() { return <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>; }
function IconTag() { return <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>; }
function IconShoppingBag() { return <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>; }
function IconStore() { return <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h18v18H3zM3 9h18M9 21V9" /></svg>; }
function IconMessageCircle() { return <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>; }
function IconFingerprint() { return <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12a10 10 0 0 1 10-10 10 10 0 0 1 10 10" /><path d="M12 2v20" /><path d="M7 12a5 5 0 0 1 10 0" /><path d="M16 12a4 4 0 0 1-8 0" /><path d="M2 12h20" /></svg>; }

export default function BottomNav({
    active,
    onNavigate,
}: {
    active: string;
    onNavigate: (to: string) => void;
}) {
    const ITEM_WIDTH = 80;
    const TOTAL_WIDTH = ITEMS.length * ITEM_WIDTH;

    const activeIndex = ITEMS.findIndex(item => item.id === active);
    const x = useMotionValue(activeIndex !== -1 ? -(activeIndex * ITEM_WIDTH) : 0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const prevActive = useRef(active);

    useEffect(() => {
        const hasChanged = prevActive.current !== active;
        prevActive.current = active;
        if (hasChanged && !isDragging) {
            const currentX = x.get();
            const targetIndex = ITEMS.findIndex(item => item.id === active);
            if (targetIndex !== -1) {
                const canonical = -(targetIndex * ITEM_WIDTH);
                const diff = canonical - currentX;
                const rounds = Math.round(diff / TOTAL_WIDTH);
                const targetX = canonical - (rounds * TOTAL_WIDTH);
                animate(x, targetX, { type: "spring", stiffness: 300, damping: 30 });
            }
        }
    }, [active, isDragging, ITEM_WIDTH, TOTAL_WIDTH, x]);

    const handleItemClick = (item: BottomNavItem) => {
        if (!item.available) return;
        onNavigate(item.href);
    };

    return (
        <div className="w-full pt-1 pb-6 overflow-hidden">
            <motion.div
                ref={scrollRef}
                drag="x"
                dragConstraints={{ left: -100000, right: 100000 }}
                dragElastic={0.05}
                dragTransition={{
                    power: 0.8,
                    timeConstant: 300,
                    modifyTarget: (target) => Math.round(target / ITEM_WIDTH) * ITEM_WIDTH
                }}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={() => setIsDragging(false)}
                style={{ x }}
                className="flex cursor-grab active:cursor-grabbing px-[calc(50vw-40px)]"
            >
                {ITEMS.map((item, i) => {
                    const isActive = item.id === active;
                    const layoutPos = i * ITEM_WIDTH;

                    const childX = useTransform(x, (latest) => {
                        const placeValue = latest + layoutPos;
                        const offset = ((placeValue + TOTAL_WIDTH / 2) % TOTAL_WIDTH + TOTAL_WIDTH) % TOTAL_WIDTH - TOTAL_WIDTH / 2;
                        return offset - placeValue;
                    });

                    const distance = useTransform(x, (latest) => {
                        const placeValue = latest + layoutPos;
                        const offset = ((placeValue + TOTAL_WIDTH / 2) % TOTAL_WIDTH + TOTAL_WIDTH) % TOTAL_WIDTH - TOTAL_WIDTH / 2;
                        return Math.abs(offset);
                    });

                    return (
                        <motion.div
                            key={item.id}
                            onTap={() => { if (!isDragging) handleItemClick(item); }}
                            className={`flex-shrink-0 flex flex-col items-center justify-center px-2 ${item.available ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                            style={{
                                width: "80px",
                                x: childX,
                                opacity: item.available ? (isActive ? 1 : 0.6) : 0.3,
                                scale: useTransform(distance, [0, 80, 160], [1.2, 0.9, 0.75]),
                                y: useTransform(distance, [0, 80], [0, 10]),
                            }}
                        >
                            <div className={`p-3 rounded-2xl transition-all duration-300 ${isActive
                                ? 'bg-[var(--accent-color)] text-white shadow-lg scale-110'
                                : item.available
                                    ? 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5'
                                    : 'text-[var(--text-secondary)]'
                                }`}>
                                {item.icon}
                            </div>
                            <div className={`text-[10px] font-bold mt-1.5 text-center tracking-wide uppercase ${isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] opacity-60'}`}>
                                {item.label}
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>
        </div>
    );
}
