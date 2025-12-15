"use client";

import { ReactNode, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import BottomNav from "@/ui/BottomNav";
import { CircularTabNav } from "@/ui/CircularTabNav";

export default function TabsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const active = useMemo(() => {
    if (!pathname) return "today";
    if (pathname.includes("/todo")) return "todo";
    if (pathname.includes("/today")) return "today";
    if (pathname.includes("/focus")) return "focus";
    if (pathname.includes("/me")) return "me";
    return "today";
  }, [pathname]) as "todo" | "today" | "focus" | "me";

  return (
    <div className="min-h-screen bg-white">
      <CircularTabNav />
      <div className="pt-16 pb-20">
        {children}
      </div>
      <BottomNav
        active={active}
        onNavigate={(to) => {
          router.push(to);
        }}
      />
    </div>
  );
}
