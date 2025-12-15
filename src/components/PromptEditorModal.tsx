"use client";

import { useEffect, useState } from "react";

type PromptRecord = {
  id?: string;
  title?: string;
  template?: string;
  provider?: string;
  model?: string;
  schedule?: string;
  context_source?: string;
};

export default function PromptEditorModal(props: {
  open: boolean;
  prompt: PromptRecord | null;
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const prompt = props.prompt;
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [title, setTitle] = useState("");
  const [template, setTemplate] = useState("");
  const [provider, setProvider] = useState("openrouter");
  const [model, setModel] = useState("");
  const [schedule, setSchedule] = useState("");
  const [contextSource, setContextSource] = useState("");

  useEffect(() => {
    if (!prompt) return;
    setTitle(prompt.title ?? "");
    setTemplate(prompt.template ?? "");
    setProvider(prompt.provider ?? "openrouter");
    setModel(prompt.model ?? "");
    setSchedule(prompt.schedule ?? "");
    setContextSource(prompt.context_source ?? "");
  }, [prompt?.id]);

  if (!props.open || !prompt) return null;

  async function save() {
    if (!prompt) return;
    setSaving(true);
    try {
      const body = {
        id: prompt.id,
        title,
        template,
        provider,
        model,
        schedule,
        context_source: contextSource,
      };

      const url = prompt.id ? "/api/ai/prompts/update" : "/api/ai/prompts/create";
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(j.error ?? "Failed to save");
        return;
      }

      await props.onChanged();
      props.onClose();
    } finally {
      setSaving(false);
    }
  }

  async function deletePrompt() {
    if (!prompt?.id) return;
    if (!confirm("Are you sure you want to delete this prompt?")) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/ai/prompts/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: prompt.id }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(j.error ?? "Failed to delete");
        return;
      }
      await props.onChanged();
      props.onClose();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 p-4 flex items-center justify-center" onMouseDown={props.onClose}>
      <div
        className="mx-auto w-full max-w-xl rounded-2xl border border-white/10 bg-[#0b0d17] text-white shadow-xl max-h-[90vh] flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="text-lg font-semibold">{prompt.id ? "Edit Prompt" : "Create Prompt"}</div>
          <button className="rounded-full border border-white/20 px-3 py-1 text-sm" onClick={props.onClose}>
            Close
          </button>
        </div>

        <div className="overflow-y-auto p-4 flex-1">
          <div className="space-y-3">
            <input
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (e.g. Daily Stock Report)"
            />

            <div className="grid grid-cols-2 gap-2">
              <select
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
              >
                <option value="openrouter">OpenRouter</option>
                <option value="openai">OpenAI</option>
                <option value="gemini">Gemini</option>
              </select>

              <input
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Model (e.g. gpt-4)"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                placeholder="Schedule (e.g. Daily)"
              />

              <input
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none"
                value={contextSource}
                onChange={(e) => setContextSource(e.target.value)}
                placeholder="Context Source (optional)"
              />
            </div>

            <textarea
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none font-mono"
              rows={10}
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              placeholder="Prompt Template. Use {{context}} for dynamic data."
            />

            <div className="mt-8 pt-4 border-t border-white/10 space-y-3">
              <button
                className="w-full rounded-full bg-white px-3 py-2 text-sm font-semibold text-black disabled:opacity-50"
                disabled={saving || deleting}
                onClick={save}
              >
                {saving ? "Saving…" : "Save changes"}
              </button>

              {prompt.id && (
                <button
                  className="w-full rounded-full border border-red-500/50 text-red-400 px-3 py-2 text-sm font-semibold hover:bg-red-500/10 disabled:opacity-50"
                  disabled={saving || deleting}
                  onClick={deletePrompt}
                >
                  {deleting ? "Deleting…" : "Delete prompt"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
