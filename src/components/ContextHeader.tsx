"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getItemsBySide, DockItem } from '@/ui/DockPad';
import { ITEMS as NAV_ITEMS } from '@/ui/BottomNav';
import { usePersona } from '@/hooks/usePersona';
import { CircularDatePicker } from '@/ui/CircularDatePicker';
import { usePlatformStore, ViewMode } from '@/lib/store/platform-store';
import { ChevronLeft, ChevronRight, Layers, Zap, Command, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Tab = 'nav' | 'actions' | 'resources' | 'timeline';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'nav', label: 'Navigate', icon: <Layers size={14} /> },
    { id: 'actions', label: 'Actions', icon: <Command size={14} /> },
    { id: 'resources', label: 'Resources', icon: <Zap size={14} /> },
    { id: 'timeline', label: 'Timeline', icon: <Calendar size={14} /> },
];

const VIEW_MODES: ViewMode[] = ["DAY", "WEEK", "SPRINT", "MONTH", "QUARTER"];

export default function ContextHeader() {
    const [activeTab, setActiveTab] = useState<Tab>('actions');
    const { persona } = usePersona();
    const router = useRouter();

    const {
        selectedDate, setSelectedDate,
        viewMode, setViewMode
    } = usePlatformStore();

    const dockItems = getItemsBySide(persona);
    const dateObj = new Date(selectedDate);

    // Helpers for Timeline
    const handlePrevDay = () => {
        const d = new Date(dateObj);
        d.setDate(d.getDate() - 1);
        setSelectedDate(d);
    };

    const handleNextDay = () => {
        const d = new Date(dateObj);
        d.setDate(d.getDate() + 1);
        setSelectedDate(d);
    };

    const dayName = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(dateObj);

    return (
        <div className="w-full flex flex-col bg-white/5 border-b border-white/5">

            {/* 1. The Switcher Header */}
            <div className="flex items-center justify-center p-2 border-b border-white/5 bg-black/20">
                <div className="flex bg-black/40 rounded-lg p-1 gap-1">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-1.5 rounded-md flex items-center gap-2 text-xs font-semibold transition-all duration-200 ${activeTab === tab.id
                                    ? 'bg-zinc-800 text-white shadow-sm'
                                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                                }`}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* 2. Scrollable Content Area */}
            <div className="w-full h-[600px] overflow-y-auto overflow-x-hidden relative bg-[#050505]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="p-6 min-h-full"
                    >

                        {/* --- TAB: NAVIGATE --- */}
                        {activeTab === 'nav' && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {NAV_ITEMS.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => router.push(item.href)}
                                        className="flex flex-col items-center justify-center p-4 rounded-xl bg-zinc-900/50 border border-white/5 hover:bg-zinc-800 hover:border-white/20 hover:scale-105 transition-all group"
                                    >
                                        <div className="mb-3 text-zinc-400 group-hover:text-white transition-colors">
                                            {item.icon}
                                        </div>
                                        <span className="text-sm font-medium text-zinc-300 group-hover:text-white">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* --- TAB: ACTIONS (Left Dock) --- */}
                        {activeTab === 'actions' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                                {dockItems.left.map((item) => (
                                    <ActionCard
                                        key={item.id}
                                        item={item}
                                        onClick={() => console.log('Action:', item.id)} // Replace with action handler
                                    />
                                ))}
                            </div>
                        )}

                        {/* --- TAB: RESOURCES (Right Dock) --- */}
                        {activeTab === 'resources' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                                {dockItems.right.map((item) => (
                                    <ActionCard
                                        key={item.id}
                                        item={item}
                                        onClick={() => console.log('Resource:', item.id)} // Replace with action handler
                                    />
                                ))}
                            </div>
                        )}

                        {/* --- TAB: TIMELINE --- */}
                        {activeTab === 'timeline' && (
                            <div className="flex flex-col items-center gap-8 py-4">
                                {/* Date Header */}
                                <div className="flex items-center gap-6">
                                    <button onClick={handlePrevDay} className="p-2 hover:bg-white/10 rounded-full text-zinc-400"><ChevronLeft /></button>
                                    <div className="text-center">
                                        <h2 className="text-2xl font-bold text-white">{dayName}, {dateObj.getDate()}</h2>
                                        <p className="text-sm text-zinc-500 uppercase tracking-widest">{dateObj.toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                                    </div>
                                    <button onClick={handleNextDay} className="p-2 hover:bg-white/10 rounded-full text-zinc-400"><ChevronRight /></button>
                                </div>

                                {/* Circular Picker */}
                                <div className="scale-100">
                                    <CircularDatePicker selectedDate={dateObj} onDateChange={setSelectedDate} />
                                </div>

                                {/* View Modes */}
                                <div className="flex gap-2 bg-zinc-900 p-1 rounded-full border border-white/5">
                                    {VIEW_MODES.map((mode) => (
                                        <button
                                            key={mode}
                                            onClick={() => setViewMode(mode)}
                                            className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${viewMode === mode ? 'bg-zinc-700 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
                                                }`}
                                        >
                                            {mode}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

// Reusable Card for Actions/Resources
function ActionCard({ item, onClick }: { item: DockItem; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/30 border border-white/5 hover:bg-zinc-800 hover:border-white/20 transition-all text-left group"
        >
            <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:scale-110 transition-all border border-white/10">
                {item.icon}
            </div>
            <div>
                <div className="text-base font-bold text-zinc-200 group-hover:text-white">{item.label}</div>
                {item.sub && <div className="text-xs text-zinc-500 group-hover:text-zinc-400">{item.sub}</div>}
            </div>
        </button>
    );
}
