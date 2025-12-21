"use client";

export default function HowToAdminPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-12">
        <section className="space-y-4 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 to-slate-800/80 p-8 shadow-2xl">
          <p className="text-xs uppercase tracking-[0.5em] text-slate-400">Admin How-to</p>
          <h1 className="text-4xl font-black">Build repeatable sections</h1>
          <p className="text-sm text-slate-300">
            This screen exists to remind admins where to find the Repetitive Design builder and what you can author in it. Only super-admins with the right permissions can publish these reusable blocks.
          </p>
          <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.4em] text-slate-500">Quick Actions</span>
              <span className="text-[10px] uppercase tracking-[0.4em] text-cyan-300">Admin mode</span>
            </div>
            <ul className="list-disc list-inside space-y-2 text-sm text-slate-200">
              <li>Navigate to <strong>/admin</strong> and open the “Repetitive Design” tab.</li>
              <li>Enter title, prerequisites, use cases, screenshots, share links, and AI prompts for the new section.</li>
              <li>Use the Task/Project/Goal templates to bootstrap new content, then publish it for users to reuse.</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-2xl">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Need inspiration?</p>
          <div className="space-y-3 text-sm text-slate-200">
            <p>Use Case: Create a weekly “Nu Flow Replay” section where users can add a title, prerequisites, images, links, and AI-suggested prompts.</p>
            <p>AI Note: When you ask “How can I slot this into my life?”, store the answer in the builder and highlight it inside Today/per-panel contexts.</p>
            <p>Share the final block via the provided link and remind users they can kickstart a task/project/goal from the template buttons.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
