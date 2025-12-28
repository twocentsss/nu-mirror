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

export interface DockItem {
  id: DockActionId;
  label: string;
  sub?: string;
  icon: React.ReactNode;
  available?: boolean;
}

export const getItemsBySide = (persona: Persona): Record<Exclude<DockPosition, 'top'>, DockItem[]> => {
  const defaultLabels = {
    capture: ["New", "Entry"],
    rant: ["Voice", "Dictate"],
    chat: ["Ask", "Assistant"],
    story: ["Journal", "Memoir"],
    agents: ["Automate", "Workflows"],
    reports: ["Trends", "Analytics"],
    focus: ["Focus", "Modes"],
    todo: ["Reminders", "Tasks"]
  };

  const personaMap: Record<Persona, typeof defaultLabels> = {
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
    CURRENT: defaultLabels,
    CREATIVE: {
      capture: ["New Sketch", "Entry"],
      rant: ["Log", "Dictate"],
      chat: ["Query", "Consult"],
      story: ["Docs", "Library"],
      agents: ["Automate", "Workflows"],
      reports: ["Load", "Performance"],
      focus: ["Focus", "Sprints"],
      todo: ["Tasks", "Backlog"]
    },
    CORP: {
      capture: ["Lead", "Entry"],
      rant: ["Brief", "Dictate"],
      chat: ["Council", "Consult"],
      story: ["Memoir", "Library"],
      agents: ["ROI", "Automate"],
      reports: ["KPIs", "Performance"],
      focus: ["Goals", "Strategy"],
      todo: ["Tasks", "Action"]
    },
    SIMPLE1: defaultLabels,
    SIMPLE2: defaultLabels,
    SIMPLE3: defaultLabels,
  };

  const labels = personaMap[persona] || defaultLabels;

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

  // Top position logic moved to TodayPage.tsx
  if (position === 'top') { return null; }

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
