"use client";

import { motion } from "framer-motion";
import { MirrorCard } from "@/ui/MirrorCard";
import { DockPosition } from "@/lib/store/dock-store";
import { usePlatformStore, ViewMode } from "@/lib/store/platform-store";
import { CircularDatePicker } from "@/ui/CircularDatePicker";
import {
  MessageCircle,
  Zap,
  Plus,
  Calendar,
  BarChart2,
  Image as ImageIcon,
  BookOpen,
  Cpu,
  Settings,
  CheckSquare,
  Target,
  User,
  Search,
  Fingerprint,
  Info,
  ChevronLeft,
  ChevronRight,
  Map,
  Activity,
  FileText,
  PartyPopper,
  SlidersHorizontal,
} from "lucide-react";
import ViewSelector from "@/components/today/ViewSelector";
import { useUIStore } from "@/lib/store/ui-store";

export type DockActionId =
  | "chat" | "solve" | "capture"
  | "calendar" | "reports" | "comics"
  | "story" | "agents" | "settings"
  | "todo" | "today" | "focus" | "me"
  | "search" | "protocol" | "about"
  | "graph" | "waterfall" | "report";

interface DockItem {
  id: DockActionId;
  label: string;
  sub?: string;
  icon: React.ReactNode;
  available?: boolean;
}

const ITEMS_BY_SIDE: Record<Exclude<DockPosition, 'top'>, DockItem[]> = {
  left: [
    { id: "capture", label: "Create Task", sub: "Quantum Capture", icon: <Plus size={18} /> },
    { id: "chat", label: "Ask Nu", sub: "Quick chat", icon: <MessageCircle size={18} /> },
    { id: "solve", label: "Auto-Solve", sub: "Break tasks", icon: <Zap size={18} /> },
  ],
  right: [
    { id: "story", label: "Story", sub: "Narrative", icon: <BookOpen size={18} /> },
    { id: "agents", label: "Agents", sub: "Automate", icon: <Cpu size={18} /> },
    { id: "comics", label: "Comics", sub: "Visuals", icon: <ImageIcon size={18} /> },
    { id: "reports", label: "Reports", sub: "Weekly", icon: <BarChart2 size={18} /> },
  ],
  bottom: [
    { id: "todo", label: "To-do", sub: "List", icon: <CheckSquare size={18} /> },
    { id: "today", label: "Today", sub: "Focus", icon: <Calendar size={18} /> },
    { id: "focus", label: "Focus", sub: "Flow", icon: <Target size={18} /> },
    { id: "me", label: "Me", sub: "Profile", icon: <User size={18} /> },
  ],
};

const VIEW_MODES: ViewMode[] = ["DAY", "WEEK", "SPRINT", "MONTH", "QUARTER"];

export default function DockPad({
  position,
  onPick,
  stats = { completed: 0, total: 0 }
}: {
  position: DockPosition;
  onPick?: (id: DockActionId) => void;
  stats?: { completed: number; total: number };
}) {
  const {
    selectedDate, setSelectedDate,
    viewMode, setViewMode,
    lfFilter, setLfFilter,
    taskViewMode, setTaskViewMode
  } = usePlatformStore();
  const { setClickOrigin } = useUIStore();
  const dateObj = new Date(selectedDate);

  const handlePrevDay = () => {
    const d = new Date(dateObj);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
  };

  const handleNextDay = () => {
    const d = new Date(dateObj);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
  };

  const dayName = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(dateObj);

  if (position === 'top') {
    return (
      <div className="p-6 flex flex-col gap-6 max-w-4xl mx-auto items-center">
        {/* Date Selector Header */}
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevDay}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 text-[var(--text-secondary)]"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="relative">
                  <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] cursor-pointer hover:opacity-80 transition flex items-center gap-2">
                    {dayName}, {dateObj.getDate()}
                    <input
                      type="date"
                      className="absolute inset-0 opacity-0 cursor-pointer w-full"
                      value={dateObj.toISOString().slice(0, 10)}
                      onChange={(e) => {
                        const d = e.target.valueAsDate;
                        if (d) setSelectedDate(d);
                      }}
                    />
                  </h2>
                </div>
                <button
                  onClick={handleNextDay}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 text-[var(--text-secondary)]"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
              <p className="text-[var(--text-secondary)] text-xs font-medium uppercase tracking-wider ml-8">
                {dateObj.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="bg-black/5 rounded-full px-4 py-1.5 flex items-center gap-2 border border-black/5 shadow-sm">
              <PartyPopper size={14} className="text-[var(--accent-color)]" />
              <span className="text-xs font-bold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                {stats.completed}/{stats.total} Accomplished
              </span>
            </div>

            <div className="flex bg-black/5 rounded-full border border-black/5 p-1 gap-1 items-center">
              {[
                { id: "protocol", icon: <Fingerprint size={16} />, title: "Nu Flow Protocol" },
                { id: "search", icon: <Search size={16} />, title: "Search" },
                { id: "settings", icon: <Settings size={16} />, title: "Settings" },
                { id: "graph", icon: <Map size={16} />, title: "Mental Map" },
                { id: "waterfall", icon: <Activity size={16} />, title: "Day Waterfall" },
                { id: "report", icon: <FileText size={16} />, title: "End of Day Report" },
                { id: "about", icon: <Info size={16} />, title: "About" },
              ].map(it => (
                <button
                  key={it.id}
                  onClick={(e) => {
                    setClickOrigin({ x: e.clientX, y: e.clientY });
                    onPick?.(it.id as DockActionId);
                  }}
                  className="p-2 rounded-full hover:bg-white text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:shadow-sm transition-all"
                  title={it.title}
                >
                  {it.icon}
                </button>
              ))}
            </div>

            <button
              className="h-10 w-10 rounded-full bg-black hover:opacity-90 flex items-center justify-center shadow-lg transition-all text-white hover:scale-105 active:scale-95"
              onClick={(e) => {
                setClickOrigin({ x: e.clientX, y: e.clientY });
                onPick?.("capture");
              }}
            >
              <Plus size={22} />
            </button>
          </div>
        </div>

        {/* Circular Date Picker */}
        <div className="w-full max-w-xl scale-90 -my-4">
          <CircularDatePicker
            selectedDate={dateObj}
            onDateChange={setSelectedDate}
          />
        </div>

        {/* Filters & View Selector */}
        <div className="w-full flex items-center justify-between gap-4">
          <div className="flex bg-black/5 rounded-full p-1 border border-black/5 shadow-sm">
            {VIEW_MODES.map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-5 py-2 rounded-full text-[11px] font-bold transition-all ${viewMode === mode
                  ? "bg-black text-white shadow-md scale-105"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="flex gap-3 items-center">
            <ViewSelector
              view={taskViewMode}
              onChange={setTaskViewMode}
            />
            <button
              onClick={() => setLfFilter(lfFilter === null ? 1 : null)}
              className={`h-9 px-4 rounded-full border text-[11px] font-bold transition-all flex items-center gap-2 shadow-sm ${lfFilter !== null
                ? "bg-[var(--accent-color)]/20 border-[var(--accent-color)]/50 text-[var(--accent-color)]"
                : "bg-black/5 border-black/5 text-[var(--text-secondary)] hover:bg-black/10"
                }`}
            >
              <SlidersHorizontal size={14} />
              {lfFilter ? `LF${lfFilter}` : "Filter"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const items = ITEMS_BY_SIDE[position as Exclude<DockPosition, 'top'>];
  const isVertical = position === 'left' || position === 'right';

  return (
    <div className={`p-6 ${isVertical ? 'flex flex-col gap-4' : 'flex flex-wrap gap-4 justify-center max-w-2xl'}`}>
      {items.map((it) => (
        <button
          key={it.id}
          className="tap group"
          onClick={() => onPick?.(it.id)}
        >
          <MirrorCard
            tilt
            className={`p-4 text-left bg-white/40 backdrop-blur-md border border-white/20 hover:border-[var(--accent-color)] hover:shadow-xl transition-all
              ${isVertical ? 'w-48' : 'w-44'}
            `}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col">
                <div className="text-[14px] font-bold text-[var(--text-primary)] leading-tight">{it.label}</div>
                {it.sub && <div className="text-[11px] text-[var(--text-secondary)] opacity-60 mt-0.5">{it.sub}</div>}
              </div>
              <div className="h-9 w-9 rounded-full bg-[var(--accent-color)]/10 flex items-center justify-center text-[var(--accent-color)] group-hover:bg-[var(--accent-color)] group-hover:text-white transition-all duration-300">
                {it.icon}
              </div>
            </div>
          </MirrorCard>
        </button>
      ))}
    </div>
  );
}
