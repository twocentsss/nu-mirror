"use client";
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
  HelpCircle,
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
import { usePersona, Persona } from "@/hooks/usePersona";

export type DockActionId =
  | "chat"
  | "solve"
  | "capture"
  | "rant"
  | "calendar"
  | "reports"
  | "comics"
  | "story"
  | "agents"
  | "settings"
  | "todo"
  | "today"
  | "focus"
  | "me"
  | "search"
  | "protocol"
  | "about"
  | "graph"
  | "waterfall"
  | "report"
  | "evidence"
  | "howto";

interface DockItem {
  id: DockActionId;
  label: string;
  sub?: string;
  icon: React.ReactNode;
  available?: boolean;
}

const getItemsBySide = (persona: Persona): Record<Exclude<DockPosition, 'top'>, DockItem[]> => {
  const labels = {
    DEVELOPER: {
      capture: ["Commit", "Entry"],
      rant: ["Log", "Dictate"],
      chat: ["Query", "Consult"],
      story: ["Docs", "Library"],
      agents: ["CI/CD", "Automate"],
      reports: ["Load", "Performance"],
      focus: ["Focus", "Sprints"],
      todo: ["Tasks", "Backlog"]
    },
    EXECUTIVE: {
      capture: ["Lead", "Entry"],
      rant: ["Brief", "Dictate"],
      chat: ["Council", "Consult"],
      story: ["Memoir", "Library"],
      agents: ["ROI", "Automate"],
      reports: ["KPIs", "Performance"],
      focus: ["Goals", "Strategy"],
      todo: ["Tasks", "Action"]
    },
    ZEN: {
      capture: ["Intend", "Entry"],
      rant: ["Breathe", "Dictate"],
      chat: ["Oracle", "Consult"],
      story: ["Flow", "Library"],
      agents: ["Serenity", "Automate"],
      reports: ["Harmony", "Performance"],
      focus: ["Present", "Moment"],
      todo: ["Tasks", "Quiet"]
    },
    CURRENT: {
      capture: ["New", "Entry"],
      rant: ["Voice", "Dictate"],
      chat: ["Ask", "Assistant"],
      story: ["Journal", "Memoir"],
      agents: ["Automate", "Workflows"],
      reports: ["Trends", "Analytics"],
      focus: ["Focus", "Modes"],
      todo: ["Reminders", "Tasks"]
    }
  }[persona] || {
    capture: ["New", "Entry"],
    rant: ["Voice", "Dictate"],
    chat: ["Ask", "Assistant"],
    story: ["Journal", "Memoir"],
    agents: ["Automate", "Workflows"],
    reports: ["Trends", "Analytics"],
    focus: ["Focus", "Modes"],
    todo: ["Reminders", "Tasks"]
  };

  return {
    left: [
      { id: "capture", label: labels.capture[0], sub: labels.capture[1], icon: <Plus size={18} /> },
      { id: "rant", label: labels.rant[0], sub: labels.rant[1], icon: <Zap size={18} /> },
      { id: "chat", label: labels.chat[0], sub: labels.chat[1], icon: <MessageCircle size={18} /> },
      { id: "howto", label: "Tips", sub: "Guide", icon: <HelpCircle size={18} /> },
    ],
    right: [
      { id: "story", label: labels.story[0], sub: labels.story[1], icon: <BookOpen size={18} /> },
      { id: "agents", label: labels.agents[0], sub: labels.agents[1], icon: <Cpu size={18} /> },
      { id: "comics", label: "Gallery", sub: "Visuals", icon: <ImageIcon size={18} /> },
      { id: "reports", label: labels.reports[0], sub: labels.reports[1], icon: <BarChart2 size={18} /> },
    ],
    bottom: [
      { id: "todo", label: labels.todo[0], sub: labels.todo[1], icon: <CheckSquare size={18} /> },
      { id: "today", label: "Today", sub: "Schedule", icon: <Calendar size={18} /> },
      { id: "focus", label: labels.focus[0], sub: labels.focus[1], icon: <Target size={18} /> },
      { id: "me", label: "Me", sub: "Profile", icon: <User size={18} /> },
    ],
  };
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
    taskViewMode, setTaskViewMode,
    showAccomplishments, setShowAccomplishments
  } = usePlatformStore();
  const { setClickOrigin } = useUIStore();
  const { persona } = usePersona();
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
                  <h2 className="text-3xl font-greeting font-bold tracking-tight text-[var(--text-primary)] cursor-pointer hover:opacity-80 transition flex items-center gap-2">
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
            <button
              onClick={() => setShowAccomplishments(!showAccomplishments)}
              className={`rounded-full px-4 py-1.5 flex items-center gap-2 border shadow-sm transition-all hover:shadow-md hover:scale-105 active:scale-95 cursor-pointer ${showAccomplishments
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-600'
                : 'bg-black/5 hover:bg-black/10 border-black/5'
                }`}
            >
              <Target size={14} className={showAccomplishments ? 'text-emerald-600' : 'text-[var(--accent-color)]'} />
              <span className="text-xs font-bold transition-colors">
                {stats.completed}/{stats.total} {showAccomplishments ? 'Completed' : 'Accomplished'}
              </span>
            </button>

            <div className="flex bg-black/5 rounded-full border border-black/5 p-1 gap-1 items-center">
              {[
                { id: "protocol", icon: <Fingerprint size={16} />, title: persona === 'DEVELOPER' ? "Auth" : persona === 'ZEN' ? "Vibe" : "ID", color: "hover:text-blue-400" },
                { id: "search", icon: <Search size={16} />, title: "Search", color: "hover:text-zinc-400" },
                { id: "settings", icon: <Settings size={16} />, title: "Settings", color: "hover:text-zinc-400" },
                { id: "graph", icon: <Map size={16} />, title: persona === 'DEVELOPER' ? "Nodes" : persona === 'ZEN' ? "Mandala" : "Map", color: "hover:text-emerald-400" },
                { id: "waterfall", icon: <Activity size={16} />, title: persona === 'DEVELOPER' ? "Perf" : persona === 'ZEN' ? "Harmony" : "Flow", color: "hover:text-amber-400" },
                { id: "report", icon: <FileText size={16} />, title: persona === 'DEVELOPER' ? "Stdout" : persona === 'ZEN' ? "Journal" : "Files", color: "hover:text-purple-400" },
                { id: "howto", icon: <HelpCircle size={16} />, title: "Tips", color: "hover:text-blue-500" },
                { id: "about", icon: <Info size={16} />, title: "Info", color: "hover:text-zinc-400" },
              ].map((it: any) => (
                <button
                  key={it.id}
                  onClick={(e) => {
                    setClickOrigin({ x: e.clientX, y: e.clientY });
                    onPick?.(it.id as DockActionId);
                  }}
                  className={`p-2 rounded-full hover:bg-[var(--glass-border)] text-[var(--text-secondary)] ${it.color} hover:shadow-sm transition-all duration-300`}
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

        {/* View Options Moved to Main Page */}
        <div className="w-full flex items-center justify-center pb-2">
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
        </div>
      </div>
    );
  }

  const items = getItemsBySide(persona)[position as Exclude<DockPosition, 'top'>];
  const isVertical = position === 'left' || position === 'right';

  return (
    <div className={`p-6 ${isVertical ? 'flex flex-col gap-4' : 'flex flex-wrap gap-4 justify-center max-w-2xl'}`}>
      {items.map((it: any) => (
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
