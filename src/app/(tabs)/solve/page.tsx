"use client";

import { useEffect, useMemo, useState } from "react";
import { MirrorCard } from "@/ui/MirrorCard";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function SolvePage() {
  const [text, setText] = useState(
    "I want to finish building the user authentication system by Friday so that the entire development team can start integrating their front-end features next week.",
  );
  const [last, setLast] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const range = useMemo(() => {
    const day = todayISO();
    return { start: day, end: day };
  }, []);

  useEffect(() => {
    void refresh();
  }, [range]);

  async function refresh() {
    try {
      const qs = new URLSearchParams(range);
      const res = await fetch(`/api/cogos/task/list?${qs.toString()}`);
      if (res.ok) {
        setStore(await res.json());
      }
    } catch (error) {
      console.error("Failed to refresh tasks", error);
    }
  }

  async function createFromText() {
    setLoading(true);
    try {
      const res = await fetch("/api/cogos/task/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_text: text, title: text.slice(0, 80) }),
      });
      const json = await res.json();
      setLast(json);
      await refresh();
    } catch (error) {
      console.error("Create failed", error);
    } finally {
      setLoading(false);
    }
  }

  async function initAccount() {
    try {
      await fetch("/api/google/account/init", { method: "POST" });
      await refresh();
    } catch (error) {
      console.error("Init failed", error);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Solve</h1>
        <p className="text-sm text-black/60">
          Google SSO → Gemini extraction → Episodes/Tasks/Worklogs/DecisionLogs/CaseBriefs in Sheets.
        </p>
      </div>

      <MirrorCard className="p-4">
        <div className="text-sm font-medium text-black/70">Input</div>
        <textarea
          className="mt-2 w-full rounded-2xl border border-black/10 bg-white/70 p-3 text-sm outline-none"
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            disabled={loading}
            onClick={() => void createFromText()}
            className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {loading ? "Creating…" : "Create task"}
          </button>
          <button
            onClick={() => void initAccount()}
            className="rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm font-medium"
          >
            Init Account
          </button>
          <button
            onClick={() => void refresh()}
            className="rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm font-medium"
          >
            Refresh
          </button>
        </div>
      </MirrorCard>

      <MirrorCard className="p-4">
        <div className="text-sm font-medium text-black/70">Last Ingest Result</div>
        <pre className="mt-2 max-h-[260px] overflow-auto rounded-2xl bg-black/5 p-3 text-xs">
          {JSON.stringify(last, null, 2)}
        </pre>
      </MirrorCard>

      <MirrorCard className="p-4">
        <div className="text-sm font-medium text-black/70">Sheet Store (by userId)</div>
        <pre className="mt-2 max-h-[420px] overflow-auto rounded-2xl bg-black/5 p-3 text-xs">
          {JSON.stringify(store, null, 2)}
        </pre>
      </MirrorCard>
    </div>
  );
}
