"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { MirrorCard } from "@/ui/MirrorCard";

interface SprintTaskCard {
  id: string;
  title: string;
  effort: string;
  tag: string;
  color: string;
}

const LIFE_FOCUS_MAP: Record<string, { label: string; color: string }> = {
  LF1: { label: "Core", color: "bg-blue-100 text-blue-800" },
  LF2: { label: "Self", color: "bg-red-100 text-red-800" },
  LF3: { label: "Circle", color: "bg-green-100 text-green-800" },
  LF4: { label: "Grind", color: "bg-indigo-100 text-indigo-800" },
  LF5: { label: "Level Up", color: "bg-yellow-100 text-yellow-800" },
  LF6: { label: "Impact", color: "bg-emerald-100 text-emerald-800" },
  LF7: { label: "Play", color: "bg-purple-100 text-purple-800" },
  LF8: { label: "Insight", color: "bg-pink-100 text-pink-800" },
  LF9: { label: "Chaos", color: "bg-slate-100 text-slate-800" },
  GENERAL: { label: "General", color: "bg-gray-100 text-gray-800" },
};

export default function SprintWidget() {
  const [cards, setCards] = useState<SprintTaskCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 13);
    end.setHours(23, 59, 59, 999);

    const params = new URLSearchParams({
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
    });

    (async () => {
      try {
        const res = await fetch(`/api/cogos/task/list?${params.toString()}`);
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Failed to load tasks");
        if (cancelled) return;

        const tasks = (body.tasks ?? []).map((task: any) => {
          const focusKey = task.lf ? `LF${task.lf}` : "GENERAL";
          const badge = LIFE_FOCUS_MAP[focusKey] ?? LIFE_FOCUS_MAP.GENERAL;
          return {
            id: task.id ?? crypto.randomUUID(),
            title: task.title ?? "Untitled task",
            effort: `${Number(task.duration_min ?? 30)}m`,
            tag: badge.label,
            color: badge.color,
          };
        });

        if (tasks.length === 0) {
          setError("No sprint tasks scheduled yet.");
        } else {
          setCards(tasks);
        }
      } catch (err: any) {
        console.error("SprintWidget load failed", err);
        if (!cancelled) setError(err.message ?? "Unable to load sprint tasks");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSwipe = (id: string, direction: "left" | "right") => {
    setCards((prev) => prev.filter((c) => c.id !== id));
    console.log(`Swiped ${id} to ${direction}`);
  };

  if (loading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="text-sm text-gray-500">Loading sprint backlog…</div>
      </div>
    );
  }

  if (error && cards.length === 0) {
    return (
      <div className="h-80 flex flex-col items-center justify-center text-center text-sm text-gray-500">
        <div>{error}</div>
        <div className="text-xs text-gray-400 mt-2">Capture tasks with the Today board to plan your sprint.</div>
      </div>
    );
  }

  return (
    <div className="w-full h-80 relative flex items-center justify-center">
      <AnimatePresence>
        {cards.map((card, index) => {
          const isTop = index === cards.length - 1;

          return (
            <motion.div
              key={card.id}
              className="absolute w-64 h-80"
              style={{ zIndex: index }}
              initial={{ scale: 0.9 + index * 0.05, y: -index * 10 }}
              animate={{
                scale: 0.9 + index * 0.05,
                y: -index * 10,
                opacity: 1,
              }}
              exit={{ x: 300, opacity: 0, rotate: 20 }}
              drag={isTop ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(_, info) => {
                if (info.offset.x > 100) handleSwipe(card.id, "right");
                else if (info.offset.x < -100) handleSwipe(card.id, "left");
              }}
            >
              <MirrorCard className="h-full w-full p-6 flex flex-col justify-between bg-white shadow-2xl border border-white/50">
                <div>
                  <div className={`text-[10px] font-bold px-2 py-1 rounded-full w-max ${card.color} mb-4`}>
                    {card.tag}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 leading-tight">{card.title}</h3>
                  <div className="text-sm text-gray-500 mt-2 font-medium">Est. {card.effort}</div>
                </div>

                <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <div>← Skip</div>
                  <div>Plan →</div>
                </div>
              </MirrorCard>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {cards.length === 0 && !loading && (
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-2">✨</div>
          <div className="font-medium">Sprint Planned</div>
        </div>
      )}
    </div>
  );
}
