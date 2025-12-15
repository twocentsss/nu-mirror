"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <button className="rounded-full border border-black/10 bg-white/60 px-3 py-1 backdrop-blur">
        …
      </button>
    );
  }

  if (!session?.user) {
    return (
      <button
        onClick={() => signIn()}
        className="rounded-full border border-black/10 bg-white/70 px-3 py-1 backdrop-blur transition hover:bg-white/90"
      >
        Sign in
      </button>
    );
  }

  return (
    <button
      onClick={() => signOut()}
      className="rounded-full border border-black/10 bg-white/70 px-3 py-1 backdrop-blur transition hover:bg-white/90"
      title={session.user.email ?? ""}
    >
      Sign out
    </button>
  );
}
