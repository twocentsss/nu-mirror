"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

type DockItem = {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  available: boolean;
};

const ITEMS: DockItem[] = [
  { id: "todo", label: "To-do", href: "/todo", available: true, icon: <IconCheckSquare /> },
  { id: "today", label: "Today", href: "/today", available: true, icon: <IconCalendar /> },
  { id: "focus", label: "Focus", href: "/focus", available: true, icon: <IconFocus /> },
  { id: "me", label: "Me", href: "/me", available: true, icon: <IconFace /> },
  { id: "comics", label: "Comics", href: "/comics", available: false, icon: <IconBook /> },
  { id: "stories", label: "Stories", href: "/stories", available: false, icon: <IconStory /> },
  { id: "reports", label: "Reports", href: "/reports", available: false, icon: <IconChart /> },
  { id: "strategies", label: "Strategies", href: "/strategies", available: false, icon: <IconTarget /> },
  { id: "assistance", label: "Assist", href: "/assistance", available: false, icon: <IconHelp /> },
  { id: "social", label: "Social", href: "/social", available: false, icon: <IconUsers /> },
  { id: "insights", label: "Insights", href: "/insights", available: false, icon: <IconBrain /> },
  { id: "goals", label: "Goals", href: "/goals", available: false, icon: <IconFlag /> },
  { id: "habits", label: "Habits", href: "/habits", available: false, icon: <IconRepeat /> },
];

// Icon components
function IconCheckSquare() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconFocus() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v6m0 6v6M1 12h6m6 0h6" />
    </svg>
  );
}

function IconFace() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  );
}

function IconBook() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function IconStory() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function IconTarget() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function IconHelp() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconBrain() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
    </svg>
  );
}

function IconFlag() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}

function IconRepeat() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

export default function BottomNav({
  active,
  onNavigate,
}: {
  active: string;
  onNavigate: (to: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);

  const infiniteItems = [...ITEMS, ...ITEMS, ...ITEMS];

  useEffect(() => {
    if (scrollRef.current) {
      const currentIndex = ITEMS.findIndex(item => item.id === active);
      if (currentIndex !== -1) {
        const itemWidth = scrollRef.current.scrollWidth / infiniteItems.length;
        const targetX = -(itemWidth * (ITEMS.length + currentIndex));
        animate(x, targetX, { type: "spring", stiffness: 300, damping: 30 });
      }
    }
  }, [active]);

  const handleDragEnd = () => {
    setIsDragging(false);
    if (!scrollRef.current) return;

    const itemWidth = scrollRef.current.scrollWidth / infiniteItems.length;
    const currentX = x.get();
    const nearestIndex = Math.round(-currentX / itemWidth);
    const targetItem = infiniteItems[nearestIndex % ITEMS.length];

    animate(x, -(nearestIndex * itemWidth), {
      type: "spring",
      stiffness: 300,
      damping: 30
    });

    setTimeout(() => {
      if (targetItem.available && targetItem.id !== active) {
        onNavigate(targetItem.href);
      }
    }, 200);
  };

  const handleItemClick = (item: DockItem) => {
    if (!item.available) return;
    if (item.id === active) return;
    onNavigate(item.href);
  };

  return (
    <div className="bottom-nav fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 safe-bottom z-50 overflow-hidden">
      <motion.div
        ref={scrollRef}
        drag="x"
        dragConstraints={{ left: -10000, right: 10000 }}
        dragElastic={0.1}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="flex cursor-grab active:cursor-grabbing py-3"
      >
        {infiniteItems.map((item, i) => {
          const isActive = item.id === active;
          const distance = useTransform(
            x,
            (latest) => {
              const itemWidth = 100;
              const itemCenter = -(i * itemWidth) - itemWidth / 2;
              const diff = Math.abs(latest - itemCenter);
              return Math.max(0, 1 - diff / 200);
            }
          );

          return (
            <motion.div
              key={`${item.id}-${i}`}
              onClick={() => handleItemClick(item)}
              className={`flex-shrink-0 flex flex-col items-center justify-center px-4 ${item.available ? 'cursor-pointer' : 'cursor-not-allowed'}`}
              style={{
                width: "100px",
                scale: useTransform(distance, [0, 1], [0.75, isActive ? 1.2 : 0.9]),
                opacity: item.available ? (isActive ? 1 : 0.5) : 0.25,
              }}
            >
              <motion.div
                className={`${isActive ? 'text-black' : item.available ? 'text-gray-600' : 'text-gray-300'}`}
                whileTap={item.available ? { scale: 0.95 } : {}}
              >
                {item.icon}
              </motion.div>
              <div className={`text-xs font-medium mt-1 text-center ${isActive ? 'text-black' : item.available ? 'text-gray-600' : 'text-gray-300'}`}>
                {item.label}
              </div>
              {!item.available && (
                <div className="text-[9px] text-gray-400 mt-0.5">Soon</div>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
