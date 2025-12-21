"use client";

import { useState } from "react";

export default function ReportControls() {
  const [storyState, setStoryState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [reportState, setReportState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  async function triggerStory() {
    setStoryState("loading");
    setMessage("");
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await fetch("/api/story/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ date: today }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Story generation failed");
      setStoryState("success");
      setMessage("Story generated—check the Stories tab soon.");
    } catch (error: any) {
      console.error("Story trigger failed", error);
      setStoryState("error");
      setMessage(error?.message ?? "Unable to generate the story");
    }
  }

  async function refreshReports() {
    setReportState("loading");
    setMessage("");
    try {
      const res = await fetch("/api/report/run", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Report refresh failed");
      setReportState("success");
      setMessage("Reports refreshed. Reload the page to view updated charts.");
    } catch (error: any) {
      console.error("Report refresh failed", error);
      setReportState("error");
      setMessage(error?.message ?? "Unable to refresh reports");
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={triggerStory}
        disabled={storyState === "loading"}
        className="px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 text-white text-sm font-semibold shadow-lg hover:opacity-90 transition disabled:opacity-60"
      >
        {storyState === "loading" ? "Generating…" : "Write Journal"}
      </button>

      <button
        onClick={refreshReports}
        disabled={reportState === "loading"}
        className="px-4 py-2 rounded-2xl border border-white/40 text-sm font-semibold text-[var(--text-primary)] bg-white/10 hover:bg-white/20 disabled:opacity-60"
      >
        {reportState === "loading" ? "Refreshing…" : "Update Trends"}
      </button>

      {message && (
        <span className="text-xs text-[var(--text-secondary)] italic tracking-wide mt-1">{message}</span>
      )}
    </div>
  );
}
