"use client";

import { useEffect, useMemo, useState } from "react";

const TEMPLATE_SECTIONS = [
  {
    label: "Task Template",
    prompt: "Capture a focused to-do that can be completed in one flow.",
  },
  {
    label: "Project Template",
    prompt: "Define a multi-day initiative with measurable outcomes.",
  },
  {
    label: "Goal Template",
    prompt: "Describe an aspirational outcome that stretches the quarter.",
  },
] as const;

type UseCase = {
  scenario: string;
  response: string;
};

type ScreenshotMeta = {
  name: string;
  subtitle?: string;
};

const EMPTY_ENTRY = {
  title: "",
  prerequisite: "",
  use_case: "",
  share_link: "",
  ai_prompt: "",
  ai_response: "",
  screenshots: [] as string[],
  use_cases: [] as UseCase[],
  admin_steps: [] as { label: string; detail: string }[],
};

export default function RepetitiveSectionBuilder() {
  const [title, setTitle] = useState(EMPTY_ENTRY.title);
  const [prerequisite, setPrerequisite] = useState(EMPTY_ENTRY.prerequisite);
  const [useCase, setUseCase] = useState(EMPTY_ENTRY.use_case);
  const [shareLink, setShareLink] = useState(EMPTY_ENTRY.share_link);
  const [screenshots, setScreenshots] = useState<string[]>(EMPTY_ENTRY.screenshots);
  const [screenshotInput, setScreenshotInput] = useState("");
  const [useCaseInput, setUseCaseInput] = useState("");
  const [useCases, setUseCases] = useState<UseCase[]>([
    { scenario: "Morning planning", response: "Story card to balance tasks + rituals." },
    { scenario: "Sprint review", response: "Frame moment summaries for stakeholders." },
  ]);
  const [aiPrompt, setAiPrompt] = useState("How can I live this repeatable flow every week?");
  const [aiResponse, setAiResponse] = useState(
    "Tie this routine to your weekly review: capture via Comics, then push task/project templates into Today."
  );
  const [screenshotMeta, setScreenshotMeta] = useState<ScreenshotMeta[]>([]);
  const [screenshotNameInput, setScreenshotNameInput] = useState("");
  const [screenshotSubtitleInput, setScreenshotSubtitleInput] = useState("");
  const [steps, setSteps] = useState([
    { label: "Step 1: Align intent", detail: "Confirm title + prerequisite so users understand the why." },
    { label: "Step 2: Map use cases", detail: "Record scenarios, share links, and AI prompts." },
  ]);
  const [stepTitleInput, setStepTitleInput] = useState("");
  const [stepDetailInput, setStepDetailInput] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  const aiSuggestion = useMemo(() => {
    if (!title) return "Add a title to unlock AI guidance.";
    return `Use "${title}" for (${useCase}) and the AI hint is: ${aiResponse}`;
  }, [title, useCase, aiResponse]);

  const addScreenshot = () => {
    if (!screenshotInput.trim()) return;
    setScreenshots((curr) => [...curr, screenshotInput.trim()]);
    setScreenshotInput("");
  };

  const addUseCase = () => {
    if (!useCaseInput.trim()) return;
    setUseCases((curr) => [...curr, { scenario: useCaseInput.trim(), response: "Pending admin response" }]);
    setUseCaseInput("");
  };

  const addStep = () => {
    if (!stepTitleInput.trim() || !stepDetailInput.trim()) return;
    setSteps((curr) => [...curr, { label: stepTitleInput.trim(), detail: stepDetailInput.trim() }]);
    setStepTitleInput("");
    setStepDetailInput("");
  };

  const addScreenshotMeta = () => {
    if (!screenshotNameInput.trim()) return;
    setScreenshotMeta((curr) => [
      ...curr,
      { name: screenshotNameInput.trim(), subtitle: screenshotSubtitleInput.trim() || undefined },
    ]);
    setScreenshotNameInput("");
    setScreenshotSubtitleInput("");
  };

  const removeStep = (index: number) => {
    setSteps((curr) => curr.filter((_, idx) => idx !== index));
  };

  const loadEntry = async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/how-to/entry", signal ? { signal } : undefined);
      if (!res.ok) return;
      const json = await res.json();
      const entry = json?.entry;
      if (!entry) return;
      setTitle(entry.title ?? "");
      setPrerequisite(entry.prerequisite ?? "");
      setUseCase(entry.use_case ?? "");
      setShareLink(entry.share_link ?? "");
      setScreenshots(entry.screenshots ?? []);
      setUseCases(entry.use_cases ?? []);
      setSteps(entry.admin_steps ?? []);
      setAiPrompt(entry.ai_prompt ?? "");
      setAiResponse(entry.ai_response ?? "");
      setScreenshotMeta(entry.screenshots_meta ?? []);
    } catch (error) {
      if ((error as any)?.name === "AbortError") return;
      console.warn("[RepetitiveSectionBuilder] failed to load entry", error);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadEntry(controller.signal);
    return () => controller.abort();
  }, []);

  const publishHowTo = async () => {
    if (publishing) return;
    setPublishing(true);
    setPublishMessage(null);
    try {
      const payload = {
        title,
        prerequisite,
        use_case: useCase,
        share_link: shareLink,
        ai_prompt: aiPrompt,
        ai_response: aiResponse,
        screenshots: screenshots.length ? screenshots : [],
        screenshots_meta: screenshotMeta.length ? screenshotMeta : [],
        use_cases: useCases.length ? useCases : [],
        admin_steps: steps.length ? steps : [],
        templates: TEMPLATE_SECTIONS,
      };
      const response = await fetch("/api/admin/how-to", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Publish failed");
      setPublishMessage("Published! Users will now see this how-to.");
      await loadEntry();
    } catch {
      setPublishMessage("Publish failed. Check admin logs.");
    } finally {
      setPublishing(false);
    }
  };

  const clearPublishedEntry = async () => {
    if (clearing) return;
    setClearing(true);
    setPublishMessage(null);
    try {
      const response = await fetch("/api/admin/how-to", { method: "DELETE" });
      if (!response.ok) throw new Error("Clear failed");
      setPublishMessage("Cleared all published entries.");
      await loadEntry();
    } catch {
      setPublishMessage("Clear failed. Check admin logs.");
    } finally {
      setClearing(false);
    }
  };

  const updateAiResponse = () => {
    setAiResponse(`Imagine pairing ${title} with your ${useCase} flow. Share it as ${shareLink} and invite the AI to craft the narrative.`);
  };

  const applyTemplate = (section: (typeof TEMPLATE_SECTIONS)[number]) => {
    setTitle(`${section.label} Routine`);
    setUseCase(section.prompt);
    setAiPrompt(`How does ${section.label.toLowerCase()} fit in my week?`);
    setUseCaseInput("");
  };

  return (
    <section className="space-y-8 rounded-2xl border border-white/5 bg-slate-950/80 p-8 shadow-xl text-white">
      <header>
        <p className="text-xs uppercase tracking-[0.5em] text-slate-400">Repetitive Section</p>
        <h2 className="text-2xl font-black">Admin Template Builder</h2>
        <p className="text-sm text-slate-400">
          Author a repeatable storybench with prerequisites, share signalling, and AI-aware prompts.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <label className="space-y-1 text-xs uppercase tracking-[0.4em] text-slate-400">
          Title
          <input
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label className="space-y-1 text-xs uppercase tracking-[0.4em] text-slate-400">
          Prerequisite
          <input
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none"
            value={prerequisite}
            onChange={(event) => setPrerequisite(event.target.value)}
          />
        </label>
      </div>

      <div className="space-y-6">
        <label className="space-y-1 text-xs uppercase tracking-[0.4em] text-slate-400">
          Use Case Description
          <textarea
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none resize-none"
            value={useCase}
            rows={2}
            onChange={(event) => setUseCase(event.target.value)}
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-xs uppercase tracking-[0.4em] text-slate-400">
            Share Link
            <input
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none"
              value={shareLink}
              onChange={(event) => setShareLink(event.target.value)}
            />
          </label>
          <label className="space-y-1 text-xs uppercase tracking-[0.4em] text-slate-400">
            AI Prompt
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none"
                value={aiPrompt}
                onChange={(event) => setAiPrompt(event.target.value)}
              />
              <button
                type="button"
                onClick={updateAiResponse}
                className="rounded-full border border-white/30 px-3 py-1 text-xs uppercase tracking-[0.4em]"
              >
                Ask AI
              </button>
            </div>
          </label>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Screenshots</p>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none"
              placeholder="Add image URL"
              value={screenshotInput}
              onChange={(e) => setScreenshotInput(e.target.value)}
            />
            <button
              type="button"
              onClick={addScreenshot}
              className="rounded-2xl border border-white/30 px-3 py-2 text-xs uppercase tracking-[0.3em]"
            >
              Add
            </button>
        </div>
          <div className="grid gap-2">
            {screenshots.map((src) => (
              <div key={src} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200">
                <span className="truncate">{src}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2 pt-3">
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Server photos (name & subtitle)</p>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none"
              placeholder="File name (e.g. city-panel.jpg)"
              value={screenshotNameInput}
              onChange={(e) => setScreenshotNameInput(e.target.value)}
            />
            <input
              className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none"
              placeholder="Subtitle / caption"
              value={screenshotSubtitleInput}
              onChange={(e) => setScreenshotSubtitleInput(e.target.value)}
            />
            <button
              type="button"
              onClick={addScreenshotMeta}
              className="rounded-2xl border border-white/30 px-3 py-2 text-xs uppercase tracking-[0.3em]"
            >
              Add
            </button>
          </div>
            <div className="space-y-2">
              {screenshotMeta.map((entry) => (
                <div
                  key={`${entry.name}-${entry.subtitle ?? ""}`}
                  className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-slate-200"
                >
                  <div className="grid gap-2">
                    <img
                      src={`/api/serverphotos/${entry.name}`}
                      alt={entry.subtitle ?? entry.name}
                      className="h-24 w-full rounded-xl object-cover"
                    />
                    <p className="font-semibold">{entry.name}</p>
                    {entry.subtitle && <p className="text-slate-400">{entry.subtitle}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
      </div>

        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Use Case → Response</p>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none"
              placeholder="Scenario name"
              value={useCaseInput}
              onChange={(e) => setUseCaseInput(e.target.value)}
            />
            <button
              type="button"
              onClick={addUseCase}
              className="rounded-2xl border border-white/30 px-3 py-2 text-xs uppercase tracking-[0.3em]"
            >
              Add
            </button>
          </div>
          <div className="space-y-2">
            {useCases.map((entry) => (
              <div key={`${entry.scenario}-${entry.response}`} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-slate-200">
                <p className="font-semibold uppercase tracking-[0.3em] text-white/80">{entry.scenario}</p>
                <p className="mt-1 leading-snug">{entry.response}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-200">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Admin steps</p>
          <span className="text-[10px] uppercase tracking-[0.4em] text-cyan-300">Optional for users</span>
        </div>
        <div className="grid gap-3">
          {steps.map((step, index) => (
            <div key={`${step.label}-${index}`} className="rounded-2xl border border-white/10 bg-slate-900 p-3 text-xs">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{step.label}</p>
                  <p className="mt-1 text-slate-300">{step.detail}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeStep(index)}
                  className="text-[9px] uppercase tracking-[0.4em] text-rose-300 hover:text-rose-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            className="rounded-2xl border border-white/10 bg-black/10 px-3 py-2 text-xs text-white outline-none"
            placeholder="Step title"
            value={stepTitleInput}
            onChange={(e) => setStepTitleInput(e.target.value)}
          />
          <input
            className="rounded-2xl border border-white/10 bg-black/10 px-3 py-2 text-xs text-white outline-none"
            placeholder="Step detail"
            value={stepDetailInput}
            onChange={(e) => setStepDetailInput(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={addStep}
          className="w-full rounded-2xl border border-white/30 px-3 py-2 text-xs uppercase tracking-[0.3em]"
        >
          Add Step
        </button>
      </div>

      <div className="space-y-3 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 p-6">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">AI Summary</p>
        <p className="text-sm text-slate-200">{aiSuggestion}</p>
      </div>

      <div className="space-y-4 rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-900 to-blue-950 p-6 text-sm text-white">
        <p className="text-xs uppercase tracking-[0.4em] text-cyan-200">Publish preview</p>
        <p className="leading-relaxed text-white/80">
          Saving here writes the data into Postgres and makes it available to `/how-to`.
        </p>
        <button
          type="button"
          onClick={publishHowTo}
          disabled={publishing}
          className="w-full rounded-2xl border border-white/40 bg-white px-3 py-2 text-xs uppercase tracking-[0.3em] font-semibold text-slate-900 transition hover:bg-white/80 disabled:opacity-40"
        >
          {publishing ? "Publishing..." : "Publish How-to"}
        </button>
        {publishMessage && <p className="text-xs text-cyan-200">{publishMessage}</p>}
      </div>

      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Quick Start Templates</p>
        <div className="grid gap-3 md:grid-cols-3">
          {TEMPLATE_SECTIONS.map((section) => (
            <div key={section.label} className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-200">
              <p className="font-semibold">{section.label}</p>
              <p className="leading-snug text-white/70">{section.prompt}</p>
              <button
                type="button"
                onClick={() => applyTemplate(section)}
                className="w-full rounded-full border border-white/30 px-3 py-1 text-[10px] uppercase tracking-[0.4em]"
              >
                Append Template
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
