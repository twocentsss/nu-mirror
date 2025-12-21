"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "@/lib/store/ui-store";
import { RECOMMENDED_MODELS } from "@/lib/llm/models";

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
  const { clickOrigin } = useUIStore();
  const modalRef = useRef<HTMLDivElement>(null);

  const getTransformOrigin = () => {
    if (!clickOrigin || !modalRef.current) return "center center";
    const rect = modalRef.current.getBoundingClientRect();
    return `${clickOrigin.x - rect.left}px ${clickOrigin.y - rect.top}px`;
  };

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
    <AnimatePresence>
      {props.open && prompt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center"
          onMouseDown={props.onClose}
        >
          <motion.div
            ref={modalRef}
            initial={{ scale: 0, opacity: 0, filter: "blur(10px)" }}
            animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
            exit={{ scale: 0, opacity: 0, filter: "blur(10px)" }}
            style={{
              transformOrigin: getTransformOrigin(),
              willChange: "transform, opacity, filter"
            }}
            transition={{
              type: "spring",
              stiffness: 120,
              damping: 25,
              mass: 1.4,
              restDelta: 0.001
            }}
            className="mx-auto w-full max-w-xl rounded-[2.5rem] border border-white/20 bg-[#121212]/95 text-white shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="text-xl font-bold">{prompt.id ? "Edit Prompt" : "Create Prompt"}</div>
              <button className="rounded-full border border-white/20 px-4 py-1.5 text-sm hover:bg-white/10 transition" onClick={props.onClose}>
                Close
              </button>
            </div>

            <div className="overflow-y-auto p-6 flex-1 scrollbar-hide">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.4em] text-white/50 px-1">Title</label>
                  <input
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-cyan-500/50 transition"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Daily Stock Report"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.4em] text-white/50 px-1">Provider</label>
                    <select
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-cyan-500/50 transition appearance-none"
                      value={provider}
                      onChange={(e) => setProvider(e.target.value)}
                    >
                      <option value="openrouter">OpenRouter</option>
                      <option value="openai">OpenAI</option>
                      <option value="gemini">Gemini</option>
                    </select>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-[0.4em] text-white/50 px-1">Model</label>
                      <input
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-cyan-500/50 transition font-mono"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        placeholder="e.g. gpt-4"
                      />
                    </div>

                    {/* Model Suggestions */}
                    <div className="flex flex-wrap gap-2">
                      {RECOMMENDED_MODELS.filter(m => m.provider === provider).map(m => (
                        <button
                          key={m.id}
                          onClick={() => setModel(m.id)}
                          className={`text-[10px] px-3 py-1.5 rounded-full border transition-all ${model === m.id
                            ? "bg-white text-black border-white"
                            : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                            }`}
                          title={m.description}
                        >
                          {m.name}
                          {m.isFree && <span className="ml-1 text-[8px] text-emerald-400 font-bold">FREE</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.4em] text-white/50 px-1">Schedule</label>
                    <input
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-cyan-500/50 transition"
                      value={schedule}
                      onChange={(e) => setSchedule(e.target.value)}
                      placeholder="e.g. Daily"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.4em] text-white/50 px-1">Context Source</label>
                    <input
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-cyan-500/50 transition"
                      value={contextSource}
                      onChange={(e) => setContextSource(e.target.value)}
                      placeholder="optional"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.4em] text-white/50 px-1">Behavior</label>
                  <textarea
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none font-mono focus:border-cyan-500/50 transition"
                    rows={10}
                    value={template}
                    onChange={(e) => setTemplate(e.target.value)}
                    placeholder="Describe how the System should behave. Use {{context}} for dynamic data."
                  />
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 space-y-3">
                  <button
                    className="w-full rounded-full bg-white px-4 py-3 text-sm font-bold text-black hover:bg-white/90 active:scale-95 transition disabled:opacity-50"
                    disabled={saving || deleting}
                    onClick={save}
                  >
                    {saving ? "Saving…" : "Save changes"}
                  </button>

                  {prompt.id && (
                    <button
                      className="w-full rounded-full border border-red-500/30 text-red-400 px-4 py-3 text-sm font-bold hover:bg-red-500/10 active:scale-95 transition disabled:opacity-50"
                      disabled={saving || deleting}
                      onClick={deletePrompt}
                    >
                      {deleting ? "Deleting…" : "Delete prompt"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
