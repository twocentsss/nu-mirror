export type ScrollSectionDef = {
  title: string;
  subtitle: string;
  hero?: string;
  fields?: { label: string; value: string }[];
  steps?: { label: string; detail: string }[];
  summary?: string;
  templates?: { label: string; prompt: string }[];
};

export default function ScrollSection({ section }: { section: ScrollSectionDef }) {
  return (
    <section className="h-screen snap-start overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl">
      <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">{section.subtitle}</p>
      <h2 className="text-3xl font-semibold">{section.title}</h2>
      {section.hero && <p className="mt-2 text-sm text-slate-300">{section.hero}</p>}
      {section.fields?.length ? (
        <dl className="mt-4 space-y-2 text-xs uppercase tracking-[0.3em] text-slate-400">
          {section.fields.map((field) => (
            <div key={field.label} className="flex justify-between border-b border-white/5 pb-1">
              <dt>{field.label}</dt>
              <dd className="text-right text-white">{field.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {section.steps?.length ? (
        <ol className="mt-4 list-decimal list-inside space-y-2 text-sm text-slate-200">
          {section.steps.map((step) => (
            <li key={step.label}>
              <p className="font-semibold text-white">{step.label}</p>
              <p className="text-slate-300">{step.detail}</p>
            </li>
          ))}
        </ol>
      ) : null}
      {section.summary && <p className="mt-4 text-xs text-slate-400">{section.summary}</p>}
      {section.templates?.length ? (
        <div className="mt-4 space-y-3 text-xs uppercase tracking-[0.3em] text-slate-400">
          <p>Quick Start Templates</p>
          {section.templates.map((template) => (
            <div key={template.label} className="rounded-2xl border border-white/10 bg-slate-950/70 p-3">
              <p className="text-[11px] font-semibold text-white">{template.label}</p>
              <p className="text-xs text-slate-300">{template.prompt}</p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
