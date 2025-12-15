"use client";

import { useRef, useState, useEffect } from "react";

type Active = "todo" | "today" | "focus" | "me";

const TABS = [
  { id: "todo" as Active, label: "To-do", href: "/todo" },
  { id: "today" as Active, label: "Today", href: "/today" },
  { id: "focus" as Active, label: "Focus", href: "/focus" },
  { id: "me" as Active, label: "Me", href: "/me" },
];

// Icon components
function IconCheckSquare({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconFocus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v6m0 6v6M1 12h6m6 0h6" />
    </svg>
  );
}

function IconFace({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  );
}

export default function BottomNav({
  active,
  onNavigate,
}: {
  active: Active;
  onNavigate: (to: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const infiniteTabs = [...TABS, ...TABS, ...TABS];

  useEffect(() => {
    if (scrollRef.current) {
      const currentIndex = TABS.findIndex(t => t.id === active);
      const tabWidth = scrollRef.current.scrollWidth / infiniteTabs.length;
      scrollRef.current.scrollLeft = tabWidth * (TABS.length + currentIndex);
    }
  }, [active]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeft(scrollRef.current?.scrollLeft || 0);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeft(scrollRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current.offsetLeft || 0);
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !scrollRef.current) return;
    const x = e.touches[0].pageX - (scrollRef.current.offsetLeft || 0);
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    if (!isDragging || !scrollRef.current) return;
    setIsDragging(false);

    const tabWidth = scrollRef.current.scrollWidth / infiniteTabs.length;
    const scrollPos = scrollRef.current.scrollLeft;
    const nearestIndex = Math.round(scrollPos / tabWidth);
    const targetTab = infiniteTabs[nearestIndex % TABS.length];

    scrollRef.current.scrollTo({
      left: nearestIndex * tabWidth,
      behavior: "smooth"
    });

    setTimeout(() => {
      if (targetTab.id !== active) {
        onNavigate(targetTab.href);
      }
    }, 200);
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const tabWidth = scrollRef.current.scrollWidth / infiniteTabs.length;
    const scrollPos = scrollRef.current.scrollLeft;

    if (scrollPos < tabWidth * TABS.length * 0.5) {
      scrollRef.current.scrollLeft = scrollPos + tabWidth * TABS.length;
    } else if (scrollPos > tabWidth * TABS.length * 2.5) {
      scrollRef.current.scrollLeft = scrollPos - tabWidth * TABS.length;
    }
  };

  const getIcon = (id: Active) => {
    const className = "w-6 h-6";
    switch (id) {
      case "todo": return <IconCheckSquare className={className} />;
      case "today": return <IconCalendar className={className} />;
      case "focus": return <IconFocus className={className} />;
      case "me": return <IconFace className={className} />;
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 safe-bottom z-50">
      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
        onScroll={handleScroll}
        className="flex overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {infiniteTabs.map((tab, i) => {
          const isActive = tab.id === active;
          return (
            <div
              key={`${tab.id}-${i}`}
              className="flex-shrink-0 flex flex-col items-center justify-center py-3 transition-all duration-300"
              style={{
                scrollSnapAlign: "center",
                width: "25vw",
                transform: isActive ? "scale(1.15)" : "scale(0.85)",
                opacity: isActive ? 1 : 0.4
              }}
            >
              <div className={`${isActive ? 'text-black' : 'text-gray-400'}`}>
                {getIcon(tab.id)}
              </div>
              <div className={`text-xs font-medium mt-1 ${isActive ? 'text-black' : 'text-gray-400'}`}>
                {tab.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
