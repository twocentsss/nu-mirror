"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import BottomNav from "@/ui/BottomNav";
import FloatingChat from "@/ui/FloatingChat";

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [chatOpen, setChatOpen] = useState(false);

  const active = useMemo(() => {
    if (!pathname) return "today";
    if (pathname.includes("/todo")) return "todo";
    if (pathname.includes("/today")) return "today";
    if (pathname.includes("/focus")) return "focus";
    if (pathname.includes("/me")) return "me";
    if (pathname.includes("/solve")) return "today";
    return "today";
  }, [pathname]);

  return (
    <div className="min-h-dvh">
      {/* Smooth iOS-like page transitions */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          className="safe-top px-4 pt-3 pb-28"
          initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
          transition={{ type: "spring", stiffness: 260, damping: 26, mass: 0.9 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>

      {/* Chat sheet */}
      <FloatingChat open={chatOpen} onOpenChange={setChatOpen} />

      {/* Dock */}
      <BottomNav
        active={active}
        onNavigate={(to) => {
          if (to === "chat") {
            setChatOpen(true);
            return;
          }
          router.push(to);
        }}
      />
    </div>
  );
}
