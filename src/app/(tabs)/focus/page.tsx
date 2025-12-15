"use client";

import TaskMenu from "@/ui/TaskMenu";
import { MirrorCard } from "@/ui/MirrorCard";

export default function FocusPage() {
  return (
    <div className="space-y-5">
      <TaskMenu title="Focus" subtitle="Placeholder for timer + active task" />

      <MirrorCard className="p-5">
        <div className="text-[14px] font-semibold">Focus is coming next</div>
        <div className="mt-2 text-[13px] text-black/55">
          This page will host: active task, timer, focus sessions, and streak hooks.
        </div>
        <div className="mt-4 rounded-[14px] border border-black/10 bg-white/70 px-4 py-3 text-[13px] text-black/60">
          Start Task → Log Focus Session → Complete → Update projections
        </div>
      </MirrorCard>
    </div>
  );
}
