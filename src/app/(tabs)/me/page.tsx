"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { MirrorCard } from "@/ui/MirrorCard";
import TaskRow from "@/ui/TaskRow";
import OpenAiKeyManager from "@/components/OpenAiKeyManager";
import { useTheme, Theme } from "@/hooks/useTheme";
import { Moon, Sun, Cloud, Coffee } from "lucide-react";

export default function MePage() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-5 px-4 min-h-screen text-[var(--text-primary)] transition-colors duration-500">
      <div className="flex flex-col gap-1 mt-4">
        <h1 className="font-serif text-[40px] leading-[1.0] tracking-[-0.02em] text-[var(--text-primary)]">
          Me
        </h1>
        <div className="flex items-center gap-3 mt-1">
          {session ? (
            <>
              <div className="text-sm font-medium text-[var(--text-secondary)]">
                {session.user?.name || session.user?.email}
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/today" })}
                className="text-xs px-2 py-1 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-md hover:opacity-80 transition text-[var(--text-primary)]"
              >
                Sign Out
              </button>
            </>
          ) : (
            <button
              onClick={() => signIn("google", { callbackUrl: "/today" })}
              className="text-sm font-medium text-[var(--accent-color)] hover:underline"
            >
              Sign in with Google
            </button>
          )}
        </div>
      </div>

      <MirrorCard className="p-5">
        <div className="text-[13px] text-[var(--text-secondary)]">This week</div>
        <div className="mt-2 text-[34px] font-serif leading-none tracking-[-0.02em] text-[var(--text-primary)]">
          72%
        </div>
        <div className="mt-2 text-[13px] text-[var(--text-secondary)]">
          Completion rate (placeholder)
        </div>
      </MirrorCard>

      <MirrorCard className="overflow-hidden">
        <div className="px-4 pt-4 pb-2 text-[13px] font-semibold text-[var(--text-secondary)]">
          Appearance
        </div>
        <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <ThemeButton
            active={theme === 'blue'}
            onClick={() => setTheme('blue')}
            label="Happy Sky"
            icon={<Cloud size={16} />}
            bg="bg-sky-100/50"
          />
          <ThemeButton
            active={theme === 'dark'}
            onClick={() => setTheme('dark')}
            label="Dark Glass"
            icon={<Moon size={16} />}
            bg="bg-slate-900/50 text-white"
          />
          <ThemeButton
            active={theme === 'white'}
            onClick={() => setTheme('white')}
            label="Pure White"
            icon={<Sun size={16} />}
            bg="bg-white border border-gray-200"
          />
          <ThemeButton
            active={theme === 'brown'}
            onClick={() => setTheme('brown')}
            label="Cozy Paper"
            icon={<Coffee size={16} />}
            bg="bg-[#f5e6d3]"
          />
        </div>
      </MirrorCard>

      <MirrorCard className="overflow-hidden">
        <div className="px-4 pt-4 pb-2 text-[13px] font-semibold text-[var(--text-secondary)]">
          Settings
        </div>
        <div className="divide-y divide-[var(--glass-border)]">
          <TaskRow title="Profile" note="Avatar, preferences (later)" onClick={() => { }} />
          <TaskRow title="Export" note="Share cards + backups (later)" onClick={() => { }} />
          <TaskRow title="Integrations" note="Google, Sheets, Vercel (later)" onClick={() => { }} />
        </div>
      </MirrorCard>

      <OpenAiKeyManager />
    </div>
  );
}

function ThemeButton({ active, onClick, label, icon, bg }: { active: boolean; onClick: () => void; label: string; icon: React.ReactNode; bg: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all ${active
          ? "border-[var(--accent-color)] ring-2 ring-[var(--accent-color)]/20"
          : "border-transparent hover:bg-[var(--glass-bg)]"
        }`}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bg} shadow-sm`}>
        {icon}
      </div>
      <span className={`text-xs font-medium ${active ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
        {label}
      </span>
    </button>
  );
}
