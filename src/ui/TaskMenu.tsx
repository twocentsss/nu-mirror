"use client";

export default function TaskMenu({
  title,
  subtitle,
  onFilter,
  onAdd,
  onRescoreAll,
}: {
  title: string;
  subtitle?: string;
  onFilter?: () => void;
  onAdd?: () => void;
  onRescoreAll?: () => void;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <div className="font-serif text-[40px] leading-[1.0] tracking-[-0.02em]">
          {title}
        </div>
        {subtitle && (
          <div className="mt-2 text-[13px] text-black/50">{subtitle}</div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {onRescoreAll && (
          <button
            className="tap rounded-full bg-white/70 backdrop-blur-[18px] border border-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] h-11 w-11 flex items-center justify-center text-[var(--text-secondary)]"
            onClick={onRescoreAll}
            aria-label="Rescore All"
            title="Rescore All Tasks"
          >
            <IconRefresh />
          </button>
        )}

        <button
          className="tap rounded-full bg-white/70 backdrop-blur-[18px] border border-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] h-11 w-11 flex items-center justify-center"
          onClick={onFilter}
          aria-label="Filter"
        >
          <IconSliders />
        </button>

        <button
          className="tap rounded-full bg-white/70 backdrop-blur-[18px] border border-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] h-11 w-11 flex items-center justify-center"
          onClick={onAdd}
          aria-label="Add"
        >
          <IconPlus />
        </button>
      </div>
    </div>
  );
}

function IconPlus() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="rgba(0,0,0,0.65)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconSliders() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M4 6h10M18 6h2" stroke="rgba(0,0,0,0.55)" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 12h6M14 12h6" stroke="rgba(0,0,0,0.55)" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 18h14M20 18h0" stroke="rgba(0,0,0,0.55)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="6" r="2" stroke="rgba(0,0,0,0.55)" strokeWidth="2" />
      <circle cx="12" cy="12" r="2" stroke="rgba(0,0,0,0.55)" strokeWidth="2" />
      <circle cx="18" cy="18" r="2" stroke="rgba(0,0,0,0.55)" strokeWidth="2" />
    </svg>
  );
}

function IconRefresh() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M23 4v6h-6" stroke="rgba(0,0,0,0.55)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M1 20v-6h6" stroke="rgba(0,0,0,0.55)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" stroke="rgba(0,0,0,0.55)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
