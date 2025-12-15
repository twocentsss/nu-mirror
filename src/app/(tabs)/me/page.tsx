"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { MirrorCard } from "@/ui/MirrorCard";
import TaskRow from "@/ui/TaskRow";
import OpenAiKeyManager from "@/components/OpenAiKeyManager";

export default function MePage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-[40px] leading-[1.0] tracking-[-0.02em]">
          Me
        </h1>
        <div className="flex items-center gap-3 mt-1">
          {session ? (
            <>
              <div className="text-sm font-medium text-black/70">
                {session.user?.name || session.user?.email}
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/today" })}
                className="text-xs px-2 py-1 bg-gray-200 rounded-md hover:bg-gray-300 transition"
              >
                Sign Out
              </button>
            </>
          ) : (
            <button
              onClick={() => signIn("google", { callbackUrl: "/today" })}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              Sign in with Google
            </button>
          )}
        </div>
      </div>

      <MirrorCard className="p-5">
        <div className="text-[13px] text-black/55">This week</div>
        <div className="mt-2 text-[34px] font-serif leading-none tracking-[-0.02em]">
          72%
        </div>
        <div className="mt-2 text-[13px] text-black/55">
          Completion rate (placeholder)
        </div>
      </MirrorCard>

      <MirrorCard className="overflow-hidden">
        <div className="px-4 pt-4 pb-2 text-[13px] font-semibold text-black/60">
          Settings
        </div>
        <div className="divide-y divide-black/5">
          <TaskRow title="Profile" note="Avatar, preferences (later)" onClick={() => { }} />
          <TaskRow title="Export" note="Share cards + backups (later)" onClick={() => { }} />
          <TaskRow title="Integrations" note="Google, Sheets, Vercel (later)" onClick={() => { }} />
        </div>
      </MirrorCard>

      <OpenAiKeyManager />
    </div>
  );
}
