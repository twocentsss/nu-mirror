"use client";

import DockBar from "@/components/layout/DockBar";
import DockPad from "@/ui/DockPad";
import BottomNav from "@/ui/BottomNav";
import ScrollAwareLayout from "@/components/ScrollAwareLayout";
import ZenModeHome from "@/components/ZenModeHome";
import SimpleDesignView from "@/components/SimpleDesignView";
import { usePathname, useRouter } from "next/navigation";
import { usePlatformStore } from "@/lib/store/platform-store";
import { computeRange } from "@/lib/utils/date";
import { useEffect, useState, useMemo } from "react";
import { useTheme } from "@/hooks/useTheme";
import TaskEditorModal from "@/components/TaskEditorModal";
import { useUIStore } from "@/lib/store/ui-store";
import AboutModal from "@/components/AboutModal";
import { WorldGraphView } from "@/components/WorldGraphView";
import { DayWaterfallView } from "@/components/DayWaterfallView";
import { EndOfDayReport } from "@/components/EndOfDayReport";
import { PersonalizationView } from "@/components/PersonalizationView";
import { AnimatePresence } from "framer-motion";
import RantModal from "@/components/RantModal";
import { useSession } from "next-auth/react";
import { useDockStore } from "@/lib/store/dock-store";
import { usePersona } from "@/hooks/usePersona";


export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const active = pathname.split("/").pop() || "today";
  const selectedDate = usePlatformStore(s => s.selectedDate);
  const viewMode = usePlatformStore(s => s.viewMode);
  const setViewMode = usePlatformStore(s => s.setViewMode);
  const setSelectedDate = usePlatformStore(s => s.setSelectedDate);
  const tasks = usePlatformStore(s => s.tasks);
  const setTasks = usePlatformStore(s => s.setTasks);
  const refreshTasks = usePlatformStore(s => s.refreshTasks);
  const { data: session, status } = useSession();

  const {
    showAbout, setShowAbout,
    showGraph, setShowGraph,
    showWaterfall, setShowWaterfall,
    showReport, setShowReport,
    showPersonalization, setShowPersonalization,
    showRantModal, setShowRantModal,
    showTaskEditor, editingTask, openTaskEditor, closeTaskEditor,
    setNavVisible
  } = useUIStore();
  const { persona } = usePersona();
  const isZen = persona === "ZEN";
  const isSimple = persona === "SIMPLE1" || persona === "SIMPLE2" || persona === "SIMPLE3";
  const simpleVariant = persona === "SIMPLE1" ? 1 : persona === "SIMPLE2" ? 2 : persona === "SIMPLE3" ? 3 : 1;
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(250); // Default 250px


  const isTopVisible = useDockStore(s => s.visibility.top);
  const [identitySeed, setIdentitySeed] = useState(0);

  useEffect(() => {
    if (isTopVisible) {
      setIdentitySeed(s => s + 1);
    }
  }, [isTopVisible]);

  useEffect(() => {
    setNavVisible(true);
  }, [pathname, setNavVisible]);

  useEffect(() => {
    if (status === "unauthenticated") {
      setTasks([]);
    }
  }, [status, setTasks]);

  // Data is managed by sub-pages (TodayPage etc) to avoid double-fetching
  // but we still subscribe to tasks for the labels
  const completedCount = tasks.filter(t => t.status === 'done').length;
  const totalTasks = tasks.length;
  const dateObj = new Date(selectedDate);
  useTheme((state) => state.theme);

  const handleAction = (action: string) => {
    if (action === "task" || action === "capture") {
      // Create new task with default due date
      openTaskEditor({ time: { due_date: selectedDate.slice(0, 10) } });
      return;
    }
    if (action === "rant") {
      setShowRantModal(true);
      return;
    }
    if (action === "about") {
      setShowAbout(true);
      return;
    }
    if (action === "graph") {
      setShowGraph(!showGraph);
      return;
    }
    if (action === "waterfall") {
      setShowWaterfall(!showWaterfall);
      return;
    }
    if (action === "report") {
      setShowReport(!showReport);
      return;
    }
    if (action === "personalization") {
      setShowPersonalization(true);
      return;
    }
    if (action === "howto") {
      router.push("/how-to");
      return;
    }
    if (action === "chat" || action === "assist") {
      router.push("/assist");
      return;
    }
  };

  const selectedRange = useMemo(() => computeRange(viewMode, new Date(selectedDate)), [viewMode, selectedDate]);
  const isToday = useMemo(() => new Date(selectedDate).toDateString() === new Date().toDateString(), [selectedDate]);
  const rangeLabel = useMemo(() => {
    if (!selectedRange) return "";
    const start = new Date(selectedRange.start);
    const end = new Date(selectedRange.end);
    if (start.toDateString() === end.toDateString()) {
      return start.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
    }
    const options = { month: "short", day: "numeric" } as const;
    const startStr = start.toLocaleDateString("en-US", options);
    const endStr = end.toLocaleDateString("en-US", options);
    return `${startStr} — ${endStr}`;
  }, [selectedRange]);

  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const topLabel = useMemo(() => {
    const hours = new Date().getHours();
    let greeting = "Good morning";
    if (hours >= 12 && hours < 17) greeting = "Good afternoon";
    if (hours >= 17) greeting = "Good evening";

    const userName = session?.user?.name || "User";
    const firstName = userName.split(" ")[0];
    const initial = firstName[0];
    const lastInitial = userName.split(" ").length > 1 ? userName.split(" ").slice(-1)[0][0] : "";

    // Randomized identity display
    const identityVariants = [firstName, initial, `${initial}${lastInitial}`];
    // Use the seed to pick, otherwise it re-randomizes on every render if not careful
    // But since it's in useMemo, Math.random() is fine IF dependencies are stable.
    // Tying to identitySeed ensures it ONLY changes when we want it to.
    const identityDisplay = identityVariants[(identitySeed + firstName.length) % identityVariants.length];

    const dayText = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    const dateLabel = isZen && (!isToday || viewMode !== "DAY")
      ? rangeLabel || dayText
      : dayText;
    const timeLabel = isZen && (!isToday || viewMode !== "DAY") ? viewMode : currentTime;

    return `${greeting}, ${identityDisplay} • ${dateLabel}`;
  }, [session, selectedDate, identitySeed, isZen, rangeLabel, isToday, viewMode, dateObj, currentTime]);

  const topParts = topLabel.split('•');
  const greetingPart = topParts[0].trim();
  const timeDisplay = isZen && (!isToday || viewMode !== "DAY") ? viewMode : currentTime;
  const datePart = `${topParts[1]?.trim() || ''} • ${timeDisplay}`;

  const leftLabel = "IDENTITY & UTILS";
  const rightLabel = "MIRROR & META";
  const bottomLabel = "NAVIGATION";

  const FULL_PAGE_SECTIONS = [
    {
      id: "repetitive",
      title: "Repetitive Section",
      subtitle: "Admin Template Builder",
      description:
        "Author a repeatable storybench with prerequisites, share signalling, and AI-aware prompts.",
      fields: [
        { label: "Title", value: "test" },
        { label: "Prerequisite", value: "test" },
        { label: "Use Case Description", value: "test" },
        { label: "Share Link", value: "https://nu.app/share/example" },
        { label: "AI Prompt", value: "How can I live this repeatable flow every week?" },
      ],
      steps: [
        { label: "Step 1: Align intent", detail: "Confirm title + prerequisite so users understand the why." },
        { label: "Step 2: Map use cases", detail: "Record scenarios, share links, and AI prompts." },
      ],
      summary: 'Use "test" for (test) and the AI hint is: Tie this routine to your weekly review: capture via Comics, then push task/project templates into Today.',
      templates: [
        { label: "Task Template", prompt: "Capture a focused to-do that can be completed in one flow." },
        { label: "Project Template", prompt: "Define a multi-day initiative with measurable outcomes." },
        { label: "Goal Template", prompt: "Describe an aspirational outcome that stretches the quarter." },
      ],
    },
  ];

  const TAB_SECTIONS = [
    { title: "Today", description: "Calibrate your daily focus by sorting tasks and rituals." },
    { title: "To-do", description: "Batch organize flows, projects, and shortcuts." },
    { title: "Focus", description: "Enter a single-objective view with timeboxing and visuals." },
    { title: "Stories", description: "Script your narrative beats and inject them into comics." },
    { title: "Comics", description: "Render panels that echo your day and rhythm." },
    { title: "Reports", description: "Compare metrics across projects, graphs, and logs." },
    { title: "Settings", description: "Tune dock behavior, notifications, and your AI keys." },
    { title: "Me", description: "Capture personal status, health, and beat reflections." },
  ];

  const FullPageScroller = () => (
    <div className="mt-10 flex h-screen w-full snap-y snap-mandatory flex-col overflow-y-auto bg-[var(--app-bg)] text-[var(--text-primary)] xl:hidden">
      {[...FULL_PAGE_SECTIONS, ...TAB_SECTIONS.map(section => ({
        id: section.title.toLowerCase(),
        title: section.title,
        subtitle: section.description,
        description: section.description,
        fields: [],
        steps: [],
        summary: "",
        templates: []
      }))].map((section) => (
        <section
          key={section.id}
          className="flex h-full w-full flex-shrink-0 snap-start flex-col items-center justify-center p-8 text-center"
        >
          <p className="mb-2 text-xs font-black uppercase tracking-[0.4em] opacity-40">Section</p>
          <h2 className="mb-4 text-5xl font-black tracking-tighter md:text-7xl">
            {section.title}
          </h2>
          <p className="mb-8 max-w-lg text-lg font-medium leading-relaxed opacity-60">
            {section.subtitle}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="rounded-full bg-white/10 px-8 py-4 text-sm font-black uppercase tracking-widest transition hover:bg-white/20">
              Explore
            </button>
            <button className="rounded-full border border-white/20 px-8 py-4 text-sm font-black uppercase tracking-widest transition hover:bg-white/10">
              Details
            </button>
          </div>
        </section>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--app-bg)] overflow-hidden select-none transition-colors duration-500">
      {/* Top Dock: Period & System */}
      {!isZen && !isSimple && (
        <DockBar position="top" label={greetingPart} labelSecondary={datePart}>
          <DockPad
            position="top"
            onPick={handleAction}
            stats={{ completed: completedCount, total: totalTasks }}
          />
        </DockBar>
      )}

      {/* Left Dock: Quick Access & Tools */}
      {!isZen && !isSimple && (
        <DockBar position="left" label={leftLabel}>
          <DockPad position="left" onPick={handleAction} />
        </DockBar>
      )}

      {/* Right Dock: Entertainment & Meta */}
      {!isZen && !isSimple && (
        <DockBar position="right" label={rightLabel}>
          <DockPad position="right" onPick={handleAction} />
        </DockBar>
      )}

      {isSimple && (
        <>
          {sidebarVisible && (
            <>
              <SimpleDesignView
                greeting={greetingPart}
                activeTab={active}
                variant={simpleVariant as 1 | 2 | 3}
                onNavigate={(path) => router.push(path)}
                onAction={handleAction}
                width={sidebarWidth}
                onWidthChange={setSidebarWidth}
              />
              {/* Toggle Button - positioned at right edge center of sidebar when visible */}
              <button
                onClick={() => setSidebarVisible(false)}
                className="fixed top-1/2 -translate-y-1/2 z-[100] w-10 h-10 rounded-full bg-black/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-black transition-all shadow-lg"
                style={{ left: `${sidebarWidth - 20}px` }}
                title="Hide Sidebar"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4L8 8L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </>
          )}
          <div className={`min-h-screen transition-all duration-300`} style={{ marginLeft: sidebarVisible ? `${sidebarWidth}px` : '0' }}>
            {/* Sidebar Toggle Button - only show when sidebar is hidden */}
            {!sidebarVisible && (
              <button
                onClick={() => setSidebarVisible(true)}
                className="fixed top-6 left-6 z-[100] w-10 h-10 rounded-full bg-black/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-black transition-all shadow-lg"
                title="Show Sidebar"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 4L8 8L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
            <ScrollAwareLayout>
              {children}
            </ScrollAwareLayout>
          </div>
        </>
      )}

      {!isSimple && (
        <ScrollAwareLayout className={isZen ? "" : "pb-24 pt-10"}>
          {isZen && (
            <ZenModeHome
              onMap={() => handleAction("graph")}
              onFlow={() => handleAction("waterfall")}
              onFile={() => handleAction("report")}
              greeting={greetingPart}
              currentTime={currentTime}
              viewMode={viewMode}
              onViewChange={setViewMode}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              activeTab={active}
            />
          )}
          {!isSimple && children}
        </ScrollAwareLayout>
      )}

      {/* Bottom Dock: Platform Navigation */}
      {!isZen && !isSimple && (
        <DockBar position="bottom" label={bottomLabel}>
          <BottomNav active={active} onNavigate={(to: string) => router.push(to)} />
        </DockBar>
      )}

      {!isZen && !isSimple && <FullPageScroller />}

      <TaskEditorModal
        open={showTaskEditor}
        task={editingTask}
        allTasks={tasks}
        onChanged={async () => {
          await refreshTasks();
          closeTaskEditor();
        }}
        onClose={closeTaskEditor}
      />

      {/* System Modals */}
      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
      <RantModal
        isOpen={showRantModal}
        onClose={() => setShowRantModal(false)}
        onCreated={async () => {
          await refreshTasks();
        }}
      />
      <AnimatePresence>
        {showGraph && <WorldGraphView key="graph" tasks={tasks} onClose={() => setShowGraph(false)} />}
        {showWaterfall && <DayWaterfallView key="waterfall" tasks={tasks} onClose={() => setShowWaterfall(false)} />}
        {showReport && <EndOfDayReport key="report" tasks={tasks} date={dateObj} onClose={() => setShowReport(false)} />}
        {showPersonalization && <PersonalizationView key="personalization" onClose={() => setShowPersonalization(false)} />}
      </AnimatePresence>
    </div>
  );
}
