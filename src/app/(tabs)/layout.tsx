"use client";

import DockBar from "@/components/layout/DockBar";
import DockPad from "@/ui/DockPad";
import BottomNav from "@/ui/BottomNav";
import ScrollAwareLayout from "@/components/ScrollAwareLayout";
import { usePathname, useRouter } from "next/navigation";
import { usePlatformStore } from "@/lib/store/platform-store";
import { useEffect, useState } from "react";
import TaskEditorModal, { TaskRecord } from "@/components/TaskEditorModal";
import { useUIStore } from "@/lib/store/ui-store";
import AboutModal from "@/components/AboutModal";
import { WorldGraphView } from "@/components/WorldGraphView";
import { DayWaterfallView } from "@/components/DayWaterfallView";
import { EndOfDayReport } from "@/components/EndOfDayReport";
import { PersonalizationView } from "@/components/PersonalizationView";
import { AnimatePresence } from "framer-motion";
import RantModal from "@/components/RantModal";

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const active = pathname.split("/").pop() || "today";
  const { selectedDate, viewMode, tasks, refreshTasks } = usePlatformStore();
  const {
    showAbout, setShowAbout,
    showGraph, setShowGraph,
    showWaterfall, setShowWaterfall,
    showReport, setShowReport,
    showPersonalization, setShowPersonalization,
    showRantModal, setShowRantModal,
    showTaskEditor, editingTask, openTaskEditor, closeTaskEditor
  } = useUIStore();

  // Real-time stats for labels

  useEffect(() => {
    refreshTasks();
  }, [selectedDate]);

  const completedCount = tasks.filter(t => t.status === 'done').length;
  const totalTasks = tasks.length;

  const handleAction = (id: string) => {
    if (id === "capture") {
      openTaskEditor({});
      return;
    }
    if (id === "rant") {
      setShowRantModal(true);
      return;
    }

    // Modal Triggers
    if (id === "about") return setShowAbout(true);
    if (id === "graph") return setShowGraph(true);
    if (id === "waterfall") return setShowWaterfall(true);
    if (id === "report") return setShowReport(true);
    if (id === "protocol") return setShowPersonalization(true);

    const routes: Record<string, string> = {
      today: "/today",
      todo: "/todo",
      focus: "/focus",
      me: "/me",
      stories: "/stories",
      comics: "/comics",
      reports: "/reports",
      settings: "/settings",
    };

    if (routes[id]) {
      router.push(routes[id]);
    } else {
      console.log(`Action: ${id}`);
    }
  };

  // Dynamic Labeling
  const dateObj = new Date(selectedDate);
  const topLabel = `${new Intl.DateTimeFormat("en-US", { month: 'short', day: 'numeric' }).format(dateObj)} · ${viewMode}`;
  const bottomLabel = `${completedCount}/${totalTasks} DONE`;
  const leftLabel = "CREATE TASK";
  const rightLabel = "Chapter 4 · 75%";

  return (
    <div className="min-h-screen bg-white overflow-hidden select-none">
      {/* Top Dock: Period & System */}
      <DockBar position="top" label={topLabel}>
        <DockPad
          position="top"
          onPick={handleAction}
          stats={{ completed: completedCount, total: totalTasks }}
        />
      </DockBar>

      {/* Left Dock: Quick Access & Tools */}
      <DockBar position="left" label={leftLabel}>
        <DockPad position="left" onPick={handleAction} />
      </DockBar>

      {/* Right Dock: Entertainment & Meta */}
      <DockBar position="right" label={rightLabel}>
        <DockPad position="right" onPick={handleAction} />
      </DockBar>

      <ScrollAwareLayout className="pb-24 pt-10">
        {children}
      </ScrollAwareLayout>

      {/* Bottom Dock: Platform Navigation */}
      <DockBar position="bottom" label={bottomLabel}>
        <BottomNav active={active} onNavigate={(to: string) => router.push(to)} />
      </DockBar>

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
