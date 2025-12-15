"use client";

import { useEffect, useState } from "react";
import { MirrorCard } from "@/ui/MirrorCard";
import PromptEditorModal from "@/components/PromptEditorModal";
import { Plus, Play, Edit2 } from "lucide-react";

type PromptRecord = {
  id?: string;
  title?: string;
  template?: string;
  provider?: string;
  model?: string;
  schedule?: string;
  context_source?: string;
};

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<PromptRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<PromptRecord | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<string | null>(null);
  const [runContext, setRunContext] = useState("");
  const [contextModalOpen, setContextModalOpen] = useState(false);
  const [promptToRun, setPromptToRun] = useState<PromptRecord | null>(null);

  async function fetchPrompts() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/prompts/list");
      if (res.ok) {
        const j = await res.json();
        setPrompts(j.prompts || []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPrompts();
  }, []);

  function openEditor(prompt?: PromptRecord) {
    setEditingPrompt(prompt ?? {});
    setEditorOpen(true);
  }

  function initiateRun(prompt: PromptRecord) {
    setPromptToRun(prompt);
    setRunContext("");
    setContextModalOpen(true);
  }

  async function executeRun() {
    if (!promptToRun?.id) return;
    setContextModalOpen(false);
    setRunning(promptToRun.id);
    setRunResult(null);
    try {
      const res = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          promptId: promptToRun.id,
          context: {
            context: runContext, // Map input to {{context}}
            date: new Date().toISOString(),
          }
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        alert(j.error ?? "Run failed");
      } else {
        setRunResult(JSON.stringify(j.result, null, 2));
      }
    } catch (e) {
      alert("Run failed");
    } finally {
      setRunning(null);
      setPromptToRun(null);
    }
  }

  return (
    <div className="min-h-screen bg-white text-black pb-32 px-4 pt-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl">Prompts</h1>
          <p className="text-gray-500 text-sm">Manage your AI routines</p>
        </div>
        <button
          className="h-10 w-10 rounded-full bg-black text-white flex items-center justify-center shadow-lg"
          onClick={() => openEditor()}
        >
          <Plus size={20} />
        </button>
      </div>

      {loading && <div className="text-center text-gray-400 py-10">Loading prompts...</div>}

      <div className="space-y-4">
        {prompts.map((p) => (
          <MirrorCard key={p.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-semibold text-lg">{p.title}</div>
                <div className="text-xs text-gray-500 mt-1 flex gap-2">
                  <span className="bg-gray-100 px-2 py-0.5 rounded">{p.provider}</span>
                  {p.model && <span className="bg-gray-100 px-2 py-0.5 rounded">{p.model}</span>}
                  {p.schedule && <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{p.schedule}</span>}
                </div>
                <div className="mt-3 text-sm text-gray-600 line-clamp-2 font-mono bg-gray-50 p-2 rounded border border-gray-100">
                  {p.template}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                  onClick={() => openEditor(p)}
                >
                  <Edit2 size={14} />
                </button>
                <button
                  className="h-8 w-8 rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-800 disabled:opacity-50"
                  onClick={() => initiateRun(p)}
                  disabled={running === p.id}
                >
                  {running === p.id ? (
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Play size={14} />
                  )}
                </button>
              </div>
            </div>
          </MirrorCard>
        ))}

        {!loading && prompts.length === 0 && (
          <div className="text-center text-gray-400 py-10">
            No prompts yet. Create one to get started.
          </div>
        )}
      </div>

      {contextModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 p-4 flex items-center justify-center" onClick={() => setContextModalOpen(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-lg mb-2">Run Prompt</h3>
            <p className="text-sm text-gray-500 mb-4">Provide context for <code>{`{{context}}`}</code> placeholder.</p>
            <textarea
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none mb-4"
              rows={5}
              value={runContext}
              onChange={(e) => setRunContext(e.target.value)}
              placeholder="Paste context here..."
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setContextModalOpen(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={executeRun} className="px-4 py-2 text-sm bg-black text-white rounded-full font-semibold">Run</button>
            </div>
          </div>
        </div>
      )}

      {runResult && (
        <div className="fixed inset-0 z-50 bg-black/60 p-4 flex items-center justify-center" onClick={() => setRunResult(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">Result</h3>
              <button onClick={() => setRunResult(null)} className="text-gray-500">Close</button>
            </div>
            <pre className="bg-gray-50 p-4 rounded-xl overflow-auto text-sm font-mono whitespace-pre-wrap">
              {runResult}
            </pre>
          </div>
        </div>
      )}

      <PromptEditorModal
        open={editorOpen}
        prompt={editingPrompt}
        onClose={() => setEditorOpen(false)}
        onChanged={fetchPrompts}
      />
    </div>
  );
}
