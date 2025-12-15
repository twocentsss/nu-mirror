"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import BottomNav from "@/ui/BottomNav";
import FloatingChat from "@/ui/FloatingChat";

export default function TabsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [chatOpen, setChatOpen] = useState(false);

  const active = useMemo(() => {
    if (!pathname) return "today";
    if (pathname.includes("/todo")) return "todo";
    if (pathname.includes("/today")) return "today";
    if (pathname.includes("/focus")) return "focus";
    if (pathname.includes("/me")) return "me";
    return "today";
  }, [pathname]);

  return (
    <div className="min-h-dvh">
      {/* content */}
      <div className="safe-top px-4 pt-3 pb-28">
        {children}
      </div>

      {/* Floating center circle (opens chatbox) */}
      <FloatingChat open={chatOpen} onOpenChange={setChatOpen} />

      {/* Bottom nav */}
      <BottomNav
        active={active}
        onNavigate={(tab) => {
          if (tab === "action") {
            setChatOpen(true);
            return;
          }
          router.push(`/${tab}`);
        }}
      />
    </div>
  );
}
