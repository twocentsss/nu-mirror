"use client";

import { signIn, signOut, useSession } from "next-auth/react";

function IconUser() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M20 21.2a8 8 0 0 0-16 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function TopNav() {
  const { data: session, status } = useSession();
  const userName = session?.user?.name ?? session?.user?.email ?? "User";

  function handleSignIn(provider?: string) {
    signIn(provider, { callbackUrl: "/today" });
  }

  return (
    <div className="flex w-full items-center justify-between border-b bg-white px-4 py-3">
      <div className="font-extrabold text-indigo-700">NuMirror</div>

      <div className="flex items-center gap-3">
        {status === "loading" ? (
          <span className="text-sm text-gray-500">Loading…</span>
        ) : session ? (
          <>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <IconUser />
              <span className="font-semibold">{userName}</span>
            </div>
            <button
              className="rounded-md border px-3 py-1.5 text-sm transition hover:bg-gray-50"
              onClick={() => signOut({ callbackUrl: "/today" })}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <button
              className="rounded-md border px-3 py-1.5 text-sm transition hover:bg-gray-50"
              onClick={() => handleSignIn("google")}
            >
              Sign in with Google
            </button>
            <button
              className="rounded-md border px-3 py-1.5 text-sm transition hover:bg-gray-50"
              title="More providers"
              onClick={() => handleSignIn()}
            >
              Other…
            </button>
          </>
        )}
      </div>
    </div>
  );
}
