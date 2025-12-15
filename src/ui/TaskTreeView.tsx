"use client";

import { MirrorCard } from "@/ui/MirrorCard";
import type { TaskNode } from "@/core/models";

export default function TaskTreeView({ tree }: { tree: TaskNode | null }) {
  return (
    <MirrorCard className="p-5">
      <div className="text-[13px] font-semibold">Task Tree</div>
      <div className="mt-2 text-[12px] text-black/55">
        Universal spine: Discover → Decide → Design → Execute → Verify → Store → Notify
      </div>

      {tree ? (
        <div className="mt-4 space-y-2">
          <Node n={tree} depth={0} />
        </div>
      ) : (
        <div className="mt-4 text-[13px] text-black/45">Generate by solving first.</div>
      )}
    </MirrorCard>
  );
}

function Node({ n, depth }: { n: TaskNode; depth: number }) {
  return (
    <div className="space-y-2">
      <div
        className="rounded-[14px] border border-black/10 bg-white/70 px-4 py-3"
        style={{ marginLeft: depth * 10 }}
      >
        <div className="text-[13px] font-semibold">{n.title}</div>
        {n.dod && <div className="mt-1 text-[12px] text-black/55">DoD: {n.dod}</div>}
      </div>
      {n.children?.map((c) => (
        <Node key={c.id} n={c} depth={depth + 1} />
      ))}
    </div>
  );
}
