"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { MirrorCard } from "@/ui/MirrorCard";

// Mock Activities
const ACTIVITIES = [
    { id: '1', title: 'Deep Work: Strategy', effort: '60m', tag: 'GRIND', color: 'bg-blue-100 text-blue-800' },
    { id: '2', title: 'Gym Session', effort: '45m', tag: 'SELF', color: 'bg-red-100 text-red-800' },
    { id: '3', title: 'Call Parents', effort: '30m', tag: 'CIRCLE', color: 'bg-green-100 text-green-800' },
    { id: '4', title: 'Read Book', effort: '20m', tag: 'INSIGHT', color: 'bg-purple-100 text-purple-800' },
];

export default function SprintWidget() {
    const [cards, setCards] = useState(ACTIVITIES);

    const handleSwipe = (id: string, direction: 'left' | 'right') => {
        // Left: Backlog, Right: Sprint
        setCards(prev => prev.filter(c => c.id !== id));
        console.log(`Swiped ${id} to ${direction}`);
    };

    return (
        <div className="w-full h-80 relative flex items-center justify-center">
            <AnimatePresence>
                {cards.map((card, index) => {
                    const isTop = index === cards.length - 1;

                    return (
                        <motion.div
                            key={card.id}
                            className="absolute w-64 h-80"
                            style={{ zIndex: index }}
                            initial={{ scale: 0.9 + index * 0.05, y: -index * 10 }}
                            animate={{
                                scale: 0.9 + index * 0.05,
                                y: -index * 10,
                                opacity: 1
                            }}
                            exit={{ x: 300, opacity: 0, rotate: 20 }}
                            drag={isTop ? "x" : false}
                            dragConstraints={{ left: 0, right: 0 }}
                            onDragEnd={(_, info) => {
                                if (info.offset.x > 100) handleSwipe(card.id, 'right');
                                else if (info.offset.x < -100) handleSwipe(card.id, 'left');
                            }}
                        >
                            <MirrorCard className="h-full w-full p-6 flex flex-col justify-between bg-white shadow-2xl border border-white/50">
                                <div>
                                    <div className={`text-[10px] font-bold px-2 py-1 rounded-full w-max ${card.color} mb-4`}>
                                        {card.tag}
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-800 leading-tight">
                                        {card.title}
                                    </h3>
                                    <div className="text-sm text-gray-500 mt-2 font-medium">
                                        Est. {card.effort}
                                    </div>
                                </div>

                                <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                                    <div>← Skip</div>
                                    <div>Plan →</div>
                                </div>
                            </MirrorCard>
                        </motion.div>
                    );
                })}
            </AnimatePresence>

            {cards.length === 0 && (
                <div className="text-center text-gray-400">
                    <div className="text-4xl mb-2">✨</div>
                    <div className="font-medium">Sprint Planned</div>
                </div>
            )}
        </div>
    );
}
