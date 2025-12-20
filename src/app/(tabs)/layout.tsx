"use client";


import { ReactNode, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import BottomNav from "@/ui/BottomNav";
import { Settings, Search, Info } from "lucide-react";
import GlobalHeader from "@/components/GlobalHeader";
import ScrollAwareLayout from "@/components/ScrollAwareLayout";

export default function TabsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const active = useMemo(() => {
    if (!pathname) return "today";
    // Check for explicit matches first
    if (pathname.includes("/today")) return "today";
    if (pathname.includes("/todo")) return "todo";
    if (pathname.includes("/focus")) return "focus";
    if (pathname.includes("/me")) return "me";
    if (pathname.includes("/sprint")) return "sprint";
    if (pathname.includes("/bingo")) return "bingo";
    if (pathname.includes("/reports")) return "reports";
    if (pathname.includes("/stories")) return "stories";
    if (pathname.includes("/comics")) return "comics";
    if (pathname.includes("/games")) return "games";
    if (pathname.includes("/social")) return "social";
    if (pathname.includes("/chat")) return "chat";
    if (pathname.includes("/learning")) return "learning";
    if (pathname.includes("/business")) return "business";
    if (pathname.includes("/selling")) return "selling";
    if (pathname.includes("/buying")) return "buying";
    if (pathname.includes("/stores")) return "stores";
    if (pathname.includes("/assistance")) return "assist";
    if (pathname.includes("/protocol")) return "protocol";

    // Fallback or specific sub-routes
    return "today";
  }, [pathname]);

  return (
    <div className="min-h-screen bg-white">
      <GlobalHeader />
      <ScrollAwareLayout className={`pb-24 ${active === 'today' ? '' : 'pt-24'}`}>
        {children}
      </ScrollAwareLayout>
      <BottomNav
        active={active}
        onNavigate={(to) => {
          router.push(to);
        }}
      />
    </div>
  );
}
