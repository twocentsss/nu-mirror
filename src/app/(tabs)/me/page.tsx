"use client";

import TaskMenu from "@/ui/TaskMenu";
import { MirrorCard } from "@/ui/MirrorCard";
import TaskRow from "@/ui/TaskRow";

export default function MePage() {
  return (
    <div className="space-y-5">
      <TaskMenu title="Me" subtitle="Insights, settings, share" />

      <MirrorCard className="p-5">
        <div className="text-[13px] text-black/55">This week</div>
        <div className="mt-2 text-[34px] font-serif leading-none tracking-[-0.02em]">
          72%
        </div>
        <div className="mt-2 text-[13px] text-black/55">
          Completion rate (placeholder)
        </div>
      </MirrorCard>

      <MirrorCard className="overflow-hidden">
        <div className="px-4 pt-4 pb-2 text-[13px] font-semibold text-black/60">
          Settings
        </div>
        <div className="divide-y divide-black/5">
          <TaskRow title="Profile" note="Avatar, preferences (later)" onClick={() => {}} />
          <TaskRow title="Export" note="Share cards + backups (later)" onClick={() => {}} />
          <TaskRow title="Integrations" note="Google, Sheets, Vercel (later)" onClick={() => {}} />
        </div>
      </MirrorCard>
    </div>
  );
}
