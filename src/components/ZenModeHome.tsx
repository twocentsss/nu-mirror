"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ViewMode } from "@/lib/store/platform-store";
import { computeRange, formatRangeLabel } from "@/lib/utils/date";

type ZenOption = {
  id: string;
  label: string;
  route?: string;
};

const OPTIONS: ZenOption[] = [
  { id: "today", label: "Today", route: "/today" },
  { id: "me", label: "Me", route: "/me" },
  { id: "games", label: "Games", route: "/games" },
  { id: "sprint", label: "Sprint", route: "/sprint" },
  { id: "comics", label: "Comics", route: "/comics" },
  { id: "stories", label: "Stories", route: "/stories" },
  { id: "reports", label: "Reports", route: "/reports" },
  { id: "map", label: "Map" },
  { id: "flow", label: "Flow" },
  { id: "file", label: "Files" },
];

type CalendarOption = {
  key: ViewMode;
  label: string;
};

const CALENDAR_OPTIONS: CalendarOption[] = [
  { key: "DAY", label: "Day" },
  { key: "WEEK", label: "Week" },
  { key: "MONTH", label: "Month" },
  { key: "SPRINT", label: "Sprint" },
  { key: "QUARTER", label: "Quarter" },
];

const CHUNK = 20;
const RANGE_LENGTH = 61;

type ZenModeHomeProps = {
  onMap: () => void;
  onFlow: () => void;
  onFile: () => void;
  greeting: string;
  currentTime: string;
  viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void;
  selectedDate: string;
  onDateChange: (date: Date) => void;
};

export default function ZenModeHome({
  onMap,
  onFlow,
  onFile,
  greeting,
  currentTime,
  viewMode,
  onViewChange,
  selectedDate,
  onDateChange,
}: ZenModeHomeProps) {
  const router = useRouter();
  const [active, setActive] = useState<string | null>(null);
  const safeSelectedDate = selectedDate || new Date().toISOString();
  const baseDate = useMemo(() => new Date(safeSelectedDate), [safeSelectedDate]);
  const isToday = useMemo(
    () => baseDate.toDateString() === new Date().toDateString(),
    [baseDate]
  );
  const periodLabel = useMemo(
    () => formatRangeLabel(computeRange(viewMode, baseDate)),
    [viewMode, baseDate]
  );
  const displayTime =
    viewMode !== "DAY" || !isToday ? periodLabel : currentTime;
  const [startDate, setStartDate] = useState<Date>(() => {
    const base = new Date(safeSelectedDate);
    base.setDate(base.getDate() - Math.floor(RANGE_LENGTH / 2));
    return base;
  });
  const scrollerRef = useRef<HTMLDivElement>(null);

  const execute = useCallback(
    (item: ZenOption) => {
      if (item.id === "map") {
        onMap();
        return;
      }
      if (item.id === "flow") {
        onFlow();
        return;
      }
      if (item.id === "file") {
        onFile();
        return;
      }
      if (item.route) {
        router.push(item.route);
      }
    },
    [onFile, onFlow, onMap, router]
  );

  const handleSelect = (item: ZenOption) => {
    setActive(item.id);
    execute(item);
  };

  const repeatedOptions = useMemo(() => [...OPTIONS, ...OPTIONS], []);

  const dayRange = useMemo(() => {
    return Array.from({ length: RANGE_LENGTH }, (_, idx) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + idx);
      return date;
    });
  }, [startDate]);

  const isoDate = baseDate.toISOString().slice(0, 10);
  const selectedDayString = baseDate.toDateString();

  const changeDate = (date: Date) => {
    onDateChange(date);
  };

  useEffect(() => {
    const first = new Date(baseDate);
    first.setDate(baseDate.getDate() - Math.floor(RANGE_LENGTH / 2));
    setStartDate(first);
    if (scrollerRef.current) {
      const centerIndex = Math.floor(RANGE_LENGTH / 2);
      const buttons = scrollerRef.current.querySelectorAll<HTMLButtonElement>("button");
      const target = buttons[centerIndex];
      if (target) {
        target.scrollIntoView({ inline: "center" });
      }
    }
  }, [baseDate]);

  const handleScroll = () => {
    const node = scrollerRef.current;
    if (!node) return;
    const threshold = 160;
    if (node.scrollLeft < threshold) {
      const nextStart = new Date(startDate);
      nextStart.setDate(nextStart.getDate() - CHUNK);
      setStartDate(nextStart);
      node.scrollLeft += CHUNK * 64;
    } else if (node.scrollLeft + node.clientWidth > node.scrollWidth - threshold) {
      const nextStart = new Date(startDate);
      nextStart.setDate(nextStart.getDate() + CHUNK);
      setStartDate(nextStart);
      node.scrollLeft -= CHUNK * 64;
    }
  };

  return (
    <div className="pointer-events-none">
      <div className="relative z-10 flex flex-col gap-6 px-6 py-6">
        <div className="space-y-2">
          <p className="text-[13px] font-semibold uppercase tracking-[0.3em] text-white/70">{greeting}</p>
          <p className="text-[32px] font-black uppercase tracking-[0.3em] text-white/90">{displayTime}</p>
        </div>

        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-[0.4em] text-white/50">Drag the timeline</div>
          <div
            ref={scrollerRef}
            onScroll={handleScroll}
            className="overflow-x-auto whitespace-nowrap scroll-smooth px-1"
          >
            <div className="flex gap-3">
              {dayRange.map((day) => {
                const isActive = day.toDateString() === selectedDayString;
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => changeDate(day)}
                    className={`pointer-events-auto flex-shrink-0 rounded-2xl border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.3em] transition ${isActive
                      ? "border-white/70 bg-white text-black"
                      : "border-white/15 bg-white/5 text-white/60 hover:border-white/40"
                    }`}
                  >
                    <div className="text-[9px] text-white/50">
                      {day.toLocaleDateString("en-US", { weekday: "short" })}
                    </div>
                    <div className="text-[16px] text-white">{day.getDate()}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="pointer-events-auto flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-white/50">
            Pick date
            <input
              type="date"
              value={isoDate}
              onChange={(event) => {
                if (!event.target.value) return;
                changeDate(new Date(event.target.value));
              }}
              className="rounded-full border border-white/20 bg-black/30 px-3 py-2 text-[11px] font-semibold text-white focus:border-white/40"
            />
          </label>
        </div>

        <div className="flex gap-2 overflow-x-auto whitespace-nowrap">
          {CALENDAR_OPTIONS.map((option) => {
            const selected = viewMode === option.key;
            const optionClass =
              "pointer-events-auto flex-shrink-0 rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] transition " +
              (selected
                ? "border-white/80 bg-white text-black"
                : "border-white/20 bg-white/10 text-white/70 hover:border-white/40");
            return (
              <button key={option.key} onClick={() => onViewChange(option.key)} className={optionClass}>
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="mt-2 overflow-x-auto whitespace-nowrap rounded-[32px] border border-white/10 bg-black/30 p-2">
          <div className="flex items-center gap-3 px-1">
            {repeatedOptions.map((item, index) => (
              <button
                key={`${item.id}-${index}`}
                onClick={() => handleSelect(item)}
                className={
                  "pointer-events-auto flex-shrink-0 rounded-[24px] border px-5 py-3 text-[11px] font-black uppercase tracking-[0.4em] transition " +
                  (active === item.id
                    ? "border-white/70 bg-white/90 text-black"
                    : "border-white/10 bg-white/5 text-white/60 hover:border-white/40 hover:text-white")
                }
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
