"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
    Settings, Activity, BookOpen, BarChart2, Layers,
    Zap, User, Coffee, Command, Fingerprint, Gamepad2, Users, Bot,
    Calendar, Sun, CalendarDays, Timer, CalendarRange, PieChart, Info, Map, Search, HelpCircle, FileText, ChevronLeft, ChevronRight
} from 'lucide-react';
import { getItemsBySide } from '@/ui/DockPad';
import { usePersona } from '@/hooks/usePersona';
import { usePlatformStore, ViewMode } from '@/lib/store/platform-store';

// --- DATA STRUCTURE ---
const TAB_SECTIONS = [
    { id: 'today', icon: Coffee, title: "Today", subtitle: "Daily Calibration", description: "Calibrate your daily focus by sorting tasks and rituals.", color: "bg-orange-500", accent: "#f97316" },
    { id: 'todo', icon: Layers, title: "To-do", subtitle: "Flow Organization", description: "Batch organize flows, projects, and shortcuts.", color: "bg-blue-500", accent: "#3b82f6" },
    { id: 'focus', icon: Zap, title: "Focus", subtitle: "Deep Work", description: "Enter a single-objective view with timeboxing.", color: "bg-purple-500", accent: "#a855f7" },
    { id: 'sprint', icon: Timer, title: "Sprint", subtitle: "Cycle Tracking", description: "Track sprint velocity and burnup.", color: "bg-pink-500", accent: "#ec4899" },
    { id: 'social', icon: Users, title: "Social", subtitle: "Connections", description: "Manage network graph.", color: "bg-indigo-500", accent: "#6366f1" },
    { id: 'games', icon: Gamepad2, title: "Games", subtitle: "Arcade", description: "Play and relax.", color: "bg-emerald-500", accent: "#10b981" },
    { id: 'stories', icon: BookOpen, title: "Stories", subtitle: "Narrative Beats", description: "Script your narrative beats into comics.", color: "bg-amber-500", accent: "#f59e0b" },
    { id: 'comics', icon: Activity, title: "Comics", subtitle: "Visual Echoes", description: "Render panels that echo your day.", color: "bg-teal-500", accent: "#14b8a6" },
    { id: 'assist', icon: Bot, title: "Assist", subtitle: "AI Helper", description: "Get assistance.", color: "bg-cyan-500", accent: "#06b6d4" },
    { id: 'reports', icon: BarChart2, title: "Reports", subtitle: "Metrics & Logs", description: "Compare metrics and analytics.", color: "bg-indigo-500", accent: "#6366f1" },
    { id: 'me', icon: User, title: "Me", subtitle: "Personal Status", description: "Capture personal status and reflections.", color: "bg-red-500", accent: "#ef4444" },
];

const TIMELINE_SECTIONS = [
    { id: 'protocol', icon: Fingerprint, title: "Protocol", subtitle: "Identity & Auth", description: "Manage identity signatures.", color: "bg-blue-600", accent: "#2563eb" },
    { id: 'graph', icon: Map, title: "Graph", subtitle: "Knowledge Net", description: "View knowledge graph nodes.", color: "bg-emerald-600", accent: "#059669" },
    { id: 'waterfall', icon: Activity, title: "Waterfall", subtitle: "Stream Flow", description: "Visualize data waterfall.", color: "bg-amber-600", accent: "#d97706" },
    { id: 'search', icon: Search, title: "Search", subtitle: "Query System", description: "Search across system.", color: "bg-zinc-500", accent: "#71717a" },
    { id: 'report', icon: FileText, title: "Report", subtitle: "Daily Log", description: "View end of day report.", color: "bg-purple-500", accent: "#a855f7" },
    { id: 'tips', icon: HelpCircle, title: "Tips", subtitle: "Assistance", description: "User guide and tips.", color: "bg-blue-500", accent: "#3b82f6" },
    { id: 'settings', icon: Settings, title: "Settings", subtitle: "System Tuning", description: "Tune dock and AI keys.", color: "bg-zinc-500", accent: "#71717a" },
    { id: 'about', icon: Info, title: "About Us", subtitle: "System Info", description: "Learn more.", color: "bg-zinc-500", accent: "#71717a" },
];

const ROLLER_ITEM_HEIGHT = 44;
const ROLLER_RADIUS = 110;

// --- COMPONENTS ---

interface HTCTileProps {
    section: typeof TAB_SECTIONS[0];
    onNavigate: (path: string) => void;
}

const HTCTile = ({ section, onNavigate }: HTCTileProps) => {
    return (
        <div
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onNavigate(`/${section.id}`);
            }}
            className="relative group cursor-pointer overflow-hidden rounded-xl bg-zinc-900/40 border border-white/5 backdrop-blur-sm transition-all duration-300 ease-out hover:scale-110 hover:z-50 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:border-white/30 hover:bg-zinc-800 active:scale-95"
        >
            <div className={`absolute inset-0 opacity-20 ${section.color} group-hover:opacity-40 transition-opacity duration-300`} />
            <div className="absolute inset-0 p-3 flex flex-col items-center justify-center text-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-sm group-hover:scale-110 transition-transform duration-300">
                    {React.isValidElement(section.icon)
                        ? React.cloneElement(section.icon as React.ReactElement, { className: "text-white/80 group-hover:text-white" })
                        : <section.icon size={16} className="text-white/80 group-hover:text-white" />
                    }
                </div>
                <h3 className="font-semibold text-xs tracking-tight text-zinc-300 group-hover:text-white transition-colors">{section.title}</h3>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---

interface SimpleDesignViewProps {
    greeting?: string;
    activeTab?: string;
    variant: 1 | 2 | 3;
    onNavigate: (path: string) => void;
    onAction?: (action: string) => void;
}

export default function SimpleDesignView({ greeting = "Good day", activeTab = "today", variant, onNavigate, onAction }: SimpleDesignViewProps) {
    const [mode, setMode] = useState<'nav' | 'actions' | 'resources' | 'timeline'>('nav');
    const { persona } = usePersona();
    const { viewMode, setViewMode } = usePlatformStore();
    const dockItems = getItemsBySide(persona);

    const activeSections = useMemo(() => {
        const mapItem = (item: any) => ({
            id: item.id,
            title: item.label,
            subtitle: item.sub || "",
            description: "",
            icon: item.icon,
            isNodeIcon: true,
            color: "bg-zinc-800",
            accent: "#ffffff"
        });
        if (mode === 'actions') return dockItems.left.map(mapItem);
        if (mode === 'resources') return dockItems.right.map(mapItem);
        if (mode === 'timeline') return TIMELINE_SECTIONS;
        return TAB_SECTIONS;
    }, [mode, persona, dockItems]);

    const handleNav = (path: string) => {
        const id = path.replace(/^\//, '');
        if (id.startsWith('view-')) {
            const modeMap: Record<string, any> = {
                'view-day': 'DAY', 'view-week': 'WEEK', 'view-sprint': 'SPRINT',
                'view-month': 'MONTH', 'view-quarter': 'QUARTER'
            };
            if (modeMap[id]) setViewMode(modeMap[id]);
            // List of IDs that trigger actions (Modals/Functions) rather than Navigation
            // explicitly EXCLUDING pages: today, todo, focus, sprint, social, games, stories, comics, assist, reports, me
            const actionIds = [
                'about', 'waterfall', 'graph', 'report', 'tips', 'personalization', 'rant',
                'capture', 'chat', 'howto', 'solve', 'settings', 'protocol', 'search'
            ];

            // Allow checking if it's in the list OR if specific overrides exist
            if (actionIds.includes(id) && onAction) {
                // Map 'tips' to 'howto' if needed, otherwise pass ID
                const param = id === 'tips' ? 'howto' : id;
                onAction(param);
            } else {
                onNavigate(path);
            }
        }
    };

    const [pixelOffset, setPixelOffset] = useState(0);
    const [activeIndex, setActiveIndex] = useState(0);
    const [containerHeight, setContainerHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 800);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleResize = () => {
            setContainerHeight(window.innerHeight);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const target = e.target as HTMLDivElement;
        const top = target.scrollTop;
        setPixelOffset(top);

        const safeHeight = containerHeight || window.innerHeight;
        const newIndex = Math.round(top / safeHeight);

        if (newIndex !== activeIndex && newIndex >= 0 && newIndex < activeSections.length) {
            setActiveIndex(newIndex);
        }
    }, [containerHeight, activeIndex, activeSections.length]);

    const scrollTo = (index: number) => {
        if (!containerRef.current) return;
        const safeHeight = containerHeight || window.innerHeight;
        containerRef.current.scrollTo({
            top: index * safeHeight,
            behavior: 'smooth'
        });
    };

    const scrollProgress = pixelOffset / ((containerHeight || window.innerHeight) * (Math.max(1, activeSections.length - 1)));

    return (
        <div
            className="fixed left-0 top-0 bottom-0 w-[250px] bg-[#050505] text-white overflow-hidden select-none border-r border-white/5"
        >

            {/* SIMPLE1: 3D Text Roller with strict app-like scrolling */}
            {variant === 1 && (
                <main
                    ref={containerRef}
                    onScroll={handleScroll}
                    className="relative h-full w-full overflow-y-scroll snap-y snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                    style={{ overscrollBehavior: 'contain', touchAction: 'pan-y' }}
                >
                    {/* Sticky Visual Layer - Full height for centering, negative margin to remove flow impact */}
                    <div className="sticky top-0 h-screen w-full mb-[-100vh] z-30 overflow-hidden flex items-center justify-center pointer-events-none">
                        <aside className="w-48 h-[400px]">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[44px] bg-white/5 backdrop-blur-md rounded-xl border border-white/10" />
                            <div className="relative h-full w-full overflow-hidden" style={{ maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)' }}>
                                <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}>
                                    {activeSections.map((item, idx) => {
                                        const currentOffset = idx - (scrollProgress * (Math.max(1, activeSections.length - 1)));
                                        const theta = currentOffset * (ROLLER_ITEM_HEIGHT / ROLLER_RADIUS);
                                        const degrees = theta * (180 / Math.PI);
                                        const isVisible = Math.abs(degrees) < 90;
                                        return (
                                            <div
                                                key={'roller-' + item.id}
                                                onClick={() => handleNav(`/${item.id}`)}
                                                className="absolute inset-x-0 flex items-center justify-center cursor-pointer pointer-events-auto"
                                                style={{
                                                    height: `${ROLLER_ITEM_HEIGHT}px`,
                                                    top: '50%',
                                                    marginTop: `-${ROLLER_ITEM_HEIGHT / 2}px`,
                                                    transform: `rotateX(${-degrees}deg) translateZ(${ROLLER_RADIUS}px)`,
                                                    opacity: isVisible ? (1 - Math.abs(degrees) / 90) : 0,
                                                    pointerEvents: isVisible ? 'auto' : 'none'
                                                }}
                                            >
                                                <span
                                                    className={`transition-colors duration-300 ${idx === activeIndex ? 'text-white' : 'text-zinc-500'}`}
                                                    style={{
                                                        fontSize: '17px',
                                                        fontWeight: idx === activeIndex ? '600' : '400',
                                                        letterSpacing: '-0.02em',
                                                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif'
                                                    }}
                                                >
                                                    {item.title}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </aside>
                    </div>

                    {/* Scroll Spacers */}
                    {activeSections.map((_, i) => (
                        <section key={i} className="h-screen w-full flex-shrink-0 snap-start" />
                    ))}
                </main>
            )}

            {/* SIMPLE2: Tiles View (Existing Logic is Fine) */}
            {variant === 2 && (
                <main className="h-full w-full flex items-center justify-center">
                    <div className="w-48 h-[400px] grid grid-cols-2 gap-2">
                        {activeSections.map((section) => (
                            <HTCTile
                                key={section.id}
                                section={section}
                                onNavigate={handleNav}
                            />
                        ))}
                    </div>
                </main>
            )}

            {/* SIMPLE3: Icons Only with strict app-like scrolling */}
            {variant === 3 && (
                <main
                    ref={containerRef}
                    onScroll={handleScroll}
                    className="relative h-full w-full overflow-y-scroll snap-y snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                    style={{ overscrollBehavior: 'contain', touchAction: 'pan-y' }}
                >
                    {/* Sticky Visual Layer - Full height for centering, negative margin to remove flow impact */}
                    <div className="sticky top-0 h-screen w-full mb-[-100vh] z-30 overflow-hidden flex items-center justify-center pointer-events-none">
                        <aside className="w-48 h-[400px]">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[44px] bg-white/5 backdrop-blur-md rounded-xl border border-white/10" />
                            <div className="relative h-full w-full overflow-hidden" style={{ maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)' }}>
                                <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}>
                                    {activeSections.map((item, idx) => {
                                        const currentOffset = idx - (scrollProgress * (Math.max(1, activeSections.length - 1)));
                                        const theta = currentOffset * (ROLLER_ITEM_HEIGHT / ROLLER_RADIUS);
                                        const degrees = theta * (180 / Math.PI);
                                        const isVisible = Math.abs(degrees) < 90;
                                        return (
                                            <div
                                                key={'roller-' + item.id}
                                                onClick={() => handleNav(`/${item.id}`)}
                                                className="absolute inset-x-0 flex items-center justify-center cursor-pointer pointer-events-auto"
                                                style={{
                                                    height: `${ROLLER_ITEM_HEIGHT}px`,
                                                    top: '50%',
                                                    marginTop: `-${ROLLER_ITEM_HEIGHT / 2}px`,
                                                    transform: `rotateX(${-degrees}deg) translateZ(${ROLLER_RADIUS}px)`,
                                                    opacity: isVisible ? (1 - Math.abs(degrees) / 90) : 0,
                                                    pointerEvents: isVisible ? 'auto' : 'none'
                                                }}
                                            >
                                                <div
                                                    className={`flex items-center justify-center`}
                                                    style={{
                                                        transition: 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
                                                        transform: `scale(${idx === activeIndex ? 1.5 : 1})`
                                                    }}
                                                >
                                                    {item.isNodeIcon
                                                        ? React.cloneElement(item.icon as any, {
                                                            size: idx === activeIndex ? 24 : 20,
                                                            style: { color: idx === activeIndex ? item.accent : '#71717a' },
                                                            className: "transition-colors duration-300"
                                                        })
                                                        : (
                                                            <item.icon
                                                                size={24}
                                                                style={{ color: idx === activeIndex ? item.accent : '#71717a' }}
                                                                className="transition-colors duration-300"
                                                            />
                                                        )
                                                    }
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </aside>
                    </div>

                    {/* Scroll Spacers */}
                    {activeSections.map((_, i) => (
                        <section key={i} className="h-screen w-full flex-shrink-0 snap-start" />
                    ))}
                </main>
            )}

            {/* Header Switcher */}
            <div className="absolute top-6 left-6 z-50 pointer-events-auto flex items-center gap-1.5">
                {[
                    { id: 'nav', icon: Layers },
                    { id: 'actions', icon: Command },
                    { id: 'resources', icon: Zap },
                    { id: 'timeline', icon: Calendar }
                ].map(t => (
                    <button
                        key={t.id}
                        onClick={() => setMode(t.id as any)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${mode === t.id ? 'bg-white text-black shadow-md' : 'bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-zinc-300'}`}
                    >
                        <t.icon size={13} />
                    </button>
                ))}
            </div>

            {/* Footer Info */}
            <div className="absolute bottom-6 left-6 z-50 pointer-events-none">
                <div className="text-[8px] font-black tracking-[0.2em] text-zinc-600 uppercase">Section</div>
                <div className="text-[10px] font-mono">0{activeIndex + 1} / {activeSections.length < 10 ? `0${activeSections.length}` : activeSections.length}</div>
            </div>
        </div>
    );
}
