"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
    Settings, Activity, BookOpen, BarChart2, Layers,
    Zap, User, Coffee, Command, Fingerprint, Gamepad2, Users, Bot,
    Calendar, Sun, CalendarDays, Timer, CalendarRange, PieChart, Info, Map, Search, HelpCircle, FileText, ChevronLeft, ChevronRight
} from 'lucide-react';
import { getItemsBySide } from '@/ui/DockPad';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
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
                        ? React.cloneElement(section.icon as React.ReactElement<any>, { className: "text-white/80 group-hover:text-white" })
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
    width?: number;
    onWidthChange?: (width: number) => void;
    onToggle?: () => void;
}

export default function SimpleDesignView({ greeting = "Good day", activeTab = "today", variant, onNavigate, onAction, width = 250, onWidthChange, onToggle }: SimpleDesignViewProps) {
    // 1. ALL HOOKS AT TOP
    const [mode, setMode] = useState<'nav' | 'actions' | 'resources' | 'timeline'>('nav');
    const [pixelOffset, setPixelOffset] = useState(0);
    const [activeIndex, setActiveIndex] = useState(0);
    const [containerHeight, setContainerHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 800);

    const containerRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number | null>(null);
    const pendingRef = useRef(0);

    const { persona } = usePersona();
    const { viewMode, setViewMode } = usePlatformStore();
    const pathname = usePathname();
    const router = useRouter();

    const dockItems = useMemo(() => getItemsBySide(persona), [persona]);

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
        if (mode === 'timeline') return TIMELINE_SECTIONS.map(s => ({ ...s, isNodeIcon: false }));
        return TAB_SECTIONS.map(s => ({ ...s, isNodeIcon: false }));
    }, [mode, dockItems]);

    // 2. EFFECTS
    useEffect(() => {
        const handleResize = () => {
            setContainerHeight(window.innerHeight);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const pathId = pathname.split('/').pop() || 'today';
        const sectionIndex = activeSections.findIndex(s => s.id === pathId);
        if (sectionIndex !== -1 && sectionIndex !== activeIndex) {
            setActiveIndex(sectionIndex);
            const safeHeight = containerHeight || window.innerHeight;
            setPixelOffset(sectionIndex * safeHeight);

            if (containerRef.current) {
                containerRef.current.scrollTo({
                    top: sectionIndex * safeHeight,
                    behavior: 'smooth'
                });
            }
        }
    }, [pathname, activeSections, containerHeight]);

    // 3. HANDLERS
    const handleNav = useCallback((path: string) => {
        const id = path.replace(/^\//, '');
        if (id.startsWith('view-')) {
            const modeMap: Record<string, any> = {
                'view-day': 'DAY', 'view-week': 'WEEK', 'view-sprint': 'SPRINT',
                'view-month': 'MONTH', 'view-quarter': 'QUARTER'
            };
            if (modeMap[id]) setViewMode(modeMap[id]);
        } else {
            const actionIds = [
                'about', 'waterfall', 'graph', 'report', 'tips', 'personalization', 'rant',
                'capture', 'chat', 'howto', 'decompose', 'calendar', 'story', 'agents',
                'settings', 'evidence'
            ];

            if (actionIds.includes(id) && onAction) {
                const param = id === 'tips' ? 'howto' : id;
                onAction(param);
            } else {
                onNavigate(path);
            }
        }
    }, [onAction, onNavigate, setViewMode]);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        pendingRef.current = (e.target as HTMLDivElement).scrollTop;
        if (rafRef.current != null) return;

        rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null;
            const top = pendingRef.current;
            setPixelOffset(top);

            const safeHeight = containerHeight || window.innerHeight;
            const newIndex = Math.round(top / safeHeight);

            if (newIndex !== activeIndex && newIndex >= 0 && newIndex < activeSections.length) {
                setActiveIndex(newIndex);
            }
        });
    }, [containerHeight, activeIndex, activeSections.length]);

    const scrollProgress = pixelOffset / ((containerHeight || window.innerHeight) * (Math.max(1, activeSections.length - 1)));

    // Calculate max width (40% of viewport)
    const maxWidth = typeof window !== 'undefined' ? window.innerWidth * 0.4 : 600;
    const minWidth = 200;

    return (
        <div
            className="fixed left-0 top-0 bottom-0 bg-[#050505] text-white overflow-hidden select-none border-r border-white/5 transition-all duration-300"
            style={{ width: `${width}px` }}
        >
            {/* Width Slider on Right Border */}
            {onWidthChange && (
                <div className="absolute top-20 -right-[6px] bottom-20 z-[60] flex items-center">
                    <div className="relative h-full">
                        <input
                            type="range"
                            min={minWidth}
                            max={maxWidth}
                            value={width}
                            onChange={(e) => onWidthChange(parseInt(e.target.value))}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[calc(100%-40px)] w-3 bg-white/10 rounded-full appearance-none cursor-pointer origin-center -rotate-90 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white/90 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white/90 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                            style={{ width: 'calc(100% - 40px)' }}
                        />
                    </div>
                </div>
            )}

            {/* SIMPLE1: 3D Text Roller with strict app-like scrolling */}
            {variant === 1 && (
                <main
                    ref={containerRef}
                    onScroll={handleScroll}
                    className="relative h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
                    style={{ overscrollBehavior: 'contain', touchAction: 'pan-y' }}
                >
                    <div className="sticky top-0 h-screen w-full mb-[-100vh] z-30 overflow-hidden flex items-center justify-center pointer-events-none">
                        <aside className="w-48 h-[400px]">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[44px] bg-white/5 backdrop-blur-md rounded-xl border border-white/10" />
                            <div className="relative h-full w-full mask-fade overflow-hidden">
                                <div className="relative w-full h-full preserve-3d" style={{ perspective: '1000px' }}>
                                    {activeSections.map((item, idx) => {
                                        const center = scrollProgress * (Math.max(1, activeSections.length - 1));
                                        const offset = idx - center;
                                        const y = offset * ROLLER_ITEM_HEIGHT;

                                        const maxRows = 4;
                                        const a = Math.abs(offset);
                                        const isVisible = a <= maxRows;

                                        const t = Math.min(1, a / maxRows);
                                        const scale = 1 - 0.18 * t;
                                        const opacity = 1 - 0.85 * t;
                                        const blur = 1.2 * t;
                                        return (
                                            <div
                                                key={'roller-' + item.id}
                                                onClick={() => handleNav(`/${item.id}`)}
                                                className="absolute inset-x-0 flex items-center justify-center cursor-pointer pointer-events-auto"
                                                style={{
                                                    height: `${ROLLER_ITEM_HEIGHT}px`,
                                                    top: '50%',
                                                    marginTop: `-${ROLLER_ITEM_HEIGHT / 2}px`,
                                                    transform: `translate3d(0, ${y}px, 0) scale(${scale})`,
                                                    opacity,
                                                    filter: `blur(${blur}px)`,
                                                    pointerEvents: isVisible ? 'auto' : 'none',
                                                    willChange: 'transform, opacity, filter'
                                                }}
                                            >
                                                <span
                                                    className={`transition-colors duration-200 ${idx === activeIndex ? 'text-white' : 'text-zinc-500'}`}
                                                    style={{
                                                        fontSize: '17px',
                                                        fontWeight: idx === activeIndex ? '600' : '400',
                                                        letterSpacing: '-0.02em',
                                                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
                                                        WebkitFontSmoothing: 'antialiased' as const,
                                                        MozOsxFontSmoothing: 'grayscale' as const
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

                    {activeSections.map((_, i) => (
                        <section key={i} className="h-screen w-full flex-shrink-0 snap-start" />
                    ))}
                </main>
            )}

            {/* SIMPLE2: Tiles View */}
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

            {/* SIMPLE3: Icons Only */}
            {variant === 3 && (
                <main
                    ref={containerRef}
                    onScroll={handleScroll}
                    className="relative h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
                    style={{ overscrollBehavior: 'contain', touchAction: 'pan-y' }}
                >
                    <div className="sticky top-0 h-screen w-full mb-[-100vh] z-30 overflow-hidden flex items-center justify-center pointer-events-none">
                        <aside className="w-48 h-[400px]">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[44px] bg-white/5 backdrop-blur-md rounded-xl border border-white/10" />
                            <div className="relative h-full w-full mask-fade overflow-hidden">
                                <div className="relative w-full h-full preserve-3d" style={{ perspective: '1000px' }}>
                                    {activeSections.map((item, idx) => {
                                        const center = scrollProgress * (Math.max(1, activeSections.length - 1));
                                        const offset = idx - center;
                                        const y = offset * ROLLER_ITEM_HEIGHT;

                                        const maxRows = 4;
                                        const a = Math.abs(offset);
                                        const isVisible = a <= maxRows;

                                        const t = Math.min(1, a / maxRows);
                                        const scale = 1 - 0.18 * t;
                                        const opacity = 1 - 0.85 * t;
                                        const blur = 1.2 * t;
                                        return (
                                            <div
                                                key={'roller-' + item.id}
                                                onClick={() => handleNav(`/${item.id}`)}
                                                className="absolute inset-x-0 flex items-center justify-center cursor-pointer pointer-events-auto"
                                                style={{
                                                    height: `${ROLLER_ITEM_HEIGHT}px`,
                                                    top: '50%',
                                                    marginTop: `-${ROLLER_ITEM_HEIGHT / 2}px`,
                                                    transform: `translate3d(0, ${y}px, 0) scale(${scale})`,
                                                    opacity,
                                                    filter: `blur(${blur}px)`,
                                                    pointerEvents: isVisible ? 'auto' : 'none',
                                                    willChange: 'transform, opacity, filter'
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

            <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .preserve-3d { transform-style: preserve-3d; }
        .mask-fade { mask-image: linear-gradient(to bottom, transparent, black 10%, black 90%, transparent); }
        .mask-fade-x { mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent); }
      `}</style>
        </div>
    );
}
