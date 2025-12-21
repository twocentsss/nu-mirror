"use client";

import { useState, useEffect } from "react";

export interface CrosswordPuzzle {
    grid: string[][];
    clues: {
        across: { number: number; clue: string; answer: string; row: number; col: number }[];
        down: { number: number; clue: string; answer: string; row: number; col: number }[];
    };
}

interface CrosswordGameProps {
    topic?: string;
    difficulty?: string;
}

export default function CrosswordGame({ topic = "general", difficulty = "medium" }: CrosswordGameProps) {
    const [puzzle, setPuzzle] = useState<CrosswordPuzzle | null>(null);
    const [userGrid, setUserGrid] = useState<string[][]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
    const [direction, setDirection] = useState<"across" | "down">("across");
    const [startTime, setStartTime] = useState<number | null>(null);
    const [completed, setCompleted] = useState(false);
    const [hints, setHints] = useState<Set<string>>(new Set());

    // Get daily key for localStorage
    const getDailyKey = () => {
        const today = new Date().toISOString().slice(0, 10);
        return `crossword_${today}_${topic}_${difficulty}`;
    };

    // Load from localStorage on mount
    useEffect(() => {
        const dailyKey = getDailyKey();
        const saved = localStorage.getItem(dailyKey);

        if (saved) {
            try {
                const data = JSON.parse(saved);
                setPuzzle(data.puzzle);
                setUserGrid(data.userGrid);
                setStartTime(data.startTime);
                setCompleted(data.completed || false);
                setHints(new Set(data.hints || []));
            } catch (err) {
                console.error("Failed to load saved puzzle:", err);
            }
        }
    }, [topic, difficulty]);

    // Save to localStorage whenever state changes
    useEffect(() => {
        if (puzzle) {
            const dailyKey = getDailyKey();
            const data = {
                puzzle,
                userGrid,
                startTime,
                completed,
                hints: Array.from(hints),
            };
            localStorage.setItem(dailyKey, JSON.stringify(data));
        }
    }, [puzzle, userGrid, startTime, completed, hints, topic, difficulty]);

    const generatePuzzle = async () => {
        setLoading(true);
        setError(null);
        setCompleted(false);
        setHints(new Set());

        try {
            const response = await fetch("/api/games/crossword/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topic, difficulty }),
            });

            if (!response.ok) {
                throw new Error("Failed to generate crossword");
            }

            const data = await response.json();
            setPuzzle(data.puzzle);

            // Initialize user grid with empty strings
            const emptyGrid = data.puzzle.grid.map((row: string[]) =>
                row.map((cell: string) => (cell === "#" ? "#" : ""))
            );
            setUserGrid(emptyGrid);
            setStartTime(Date.now());
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate puzzle");
        } finally {
            setLoading(false);
        }
    };

    const handleCellClick = (row: number, col: number) => {
        if (!puzzle || puzzle.grid[row][col] === "#") return;

        if (selectedCell?.row === row && selectedCell?.col === col) {
            // Toggle direction if clicking same cell
            setDirection(direction === "across" ? "down" : "across");
        } else {
            setSelectedCell({ row, col });
        }
    };

    const handleKeyPress = (key: string) => {
        if (!selectedCell || !puzzle) return;

        const { row, col } = selectedCell;
        const newGrid = [...userGrid.map(r => [...r])];

        if (key === "Backspace") {
            newGrid[row][col] = "";
            setUserGrid(newGrid);
            // Move to previous cell
            moveSelection(-1);
        } else if (/^[A-Za-z]$/.test(key)) {
            newGrid[row][col] = key.toUpperCase();
            setUserGrid(newGrid);
            // Move to next cell
            moveSelection(1);
        }
    };

    const moveSelection = (delta: number) => {
        if (!selectedCell || !puzzle) return;

        let { row, col } = selectedCell;

        if (direction === "across") {
            col += delta;
            // Find next valid cell
            while (col >= 0 && col < puzzle.grid[0].length && puzzle.grid[row][col] === "#") {
                col += delta;
            }
            if (col >= 0 && col < puzzle.grid[0].length) {
                setSelectedCell({ row, col });
            }
        } else {
            row += delta;
            // Find next valid cell
            while (row >= 0 && row < puzzle.grid.length && puzzle.grid[row][col] === "#") {
                row += delta;
            }
            if (row >= 0 && row < puzzle.grid.length) {
                setSelectedCell({ row, col });
            }
        }
    };

    const checkSolution = () => {
        if (!puzzle) return;

        let correct = true;
        for (let i = 0; i < puzzle.grid.length; i++) {
            for (let j = 0; j < puzzle.grid[i].length; j++) {
                if (puzzle.grid[i][j] !== "#" && userGrid[i][j] !== puzzle.grid[i][j]) {
                    correct = false;
                    break;
                }
            }
        }

        if (correct) {
            setCompleted(true);
            const timeElapsed = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
            alert(`🎉 Puzzle completed in ${timeElapsed} seconds!`);
        } else {
            alert("Not quite right. Keep trying!");
        }
    };

    const showHint = () => {
        if (!puzzle || !selectedCell) return;

        const { row, col } = selectedCell;
        const correctLetter = puzzle.grid[row][col];

        const newGrid = [...userGrid.map(r => [...r])];
        newGrid[row][col] = correctLetter;
        setUserGrid(newGrid);

        setHints(new Set([...hints, `${row}-${col}`]));
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight") {
                setDirection("across");
                moveSelection(1);
            } else if (e.key === "ArrowLeft") {
                setDirection("across");
                moveSelection(-1);
            } else if (e.key === "ArrowDown") {
                setDirection("down");
                moveSelection(1);
            } else if (e.key === "ArrowUp") {
                setDirection("down");
                moveSelection(-1);
            } else {
                handleKeyPress(e.key);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedCell, direction, puzzle, userGrid]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 border-[6px] border-[var(--glass-border)] border-t-[var(--text-primary)] rounded-full animate-spin mx-auto shadow-2xl"></div>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--text-secondary)] opacity-60">Constructing daily grid...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-10 space-y-4">
                <p className="text-red-400">{error}</p>
                <button
                    onClick={generatePuzzle}
                    className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (!puzzle) {
        return (
            <div className="text-center py-20 space-y-8">
                <p className="text-[var(--text-primary)] text-3xl font-black tracking-tighter italic">Ready to crack the grid?</p>
                <p className="text-sm text-[var(--text-secondary)] opacity-60 max-w-sm mx-auto leading-relaxed">Daily mind-benders constructed on-demand via Gemini prompts. Stressed by topic, refined by difficulty.</p>
                <button
                    onClick={generatePuzzle}
                    className="px-10 py-5 bg-[var(--text-primary)] text-[var(--app-bg)] text-sm font-black uppercase tracking-widest rounded-[2rem] hover:scale-105 active:scale-95 transition-all shadow-2xl"
                >
                    Generate Puzzle
                </button>
            </div>
        );
    }

    const getCellNumber = (row: number, col: number) => {
        const acrossClue = puzzle.clues.across.find(c => c.row === row && c.col === col);
        const downClue = puzzle.clues.down.find(c => c.row === row && c.col === col);
        return acrossClue?.number || downClue?.number || null;
    };

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex gap-2">
                    <button
                        onClick={generatePuzzle}
                        className="px-4 py-2 bg-sky-500 text-white text-sm font-semibold rounded-xl hover:bg-sky-600 transition"
                    >
                        New Puzzle
                    </button>
                    <button
                        onClick={checkSolution}
                        className="px-4 py-2 bg-emerald-500 text-white text-sm font-semibold rounded-xl hover:bg-emerald-600 transition"
                    >
                        Check Solution
                    </button>
                    <button
                        onClick={showHint}
                        disabled={!selectedCell}
                        className="px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 transition disabled:opacity-50"
                    >
                        Hint
                    </button>
                </div>
                <div className="text-xs text-slate-400">
                    {hints.size > 0 && `${hints.size} hint${hints.size > 1 ? 's' : ''} used`}
                </div>
            </div>

            <div className="grid md:grid-cols-[1fr_300px] gap-6">
                {/* Grid */}
                <div className="aspect-square max-w-lg mx-auto w-full">
                    <div
                        className="grid gap-0.5 bg-[var(--glass-border)] p-1 rounded-2xl overflow-hidden shadow-2xl"
                        style={{ gridTemplateColumns: `repeat(${puzzle.grid[0].length}, 1fr)` }}
                    >
                        {puzzle.grid.map((row, rowIndex) =>
                            row.map((cell, colIndex) => {
                                const isBlack = cell === "#";
                                const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
                                const cellNumber = getCellNumber(rowIndex, colIndex);
                                const isHinted = hints.has(`${rowIndex}-${colIndex}`);

                                return (
                                    <div
                                        key={`${rowIndex}-${colIndex}`}
                                        onClick={() => handleCellClick(rowIndex, colIndex)}
                                        className={`aspect-square relative flex items-center justify-center text-xl font-black transition cursor-pointer select-none ${isBlack
                                            ? "bg-[var(--app-bg)] opacity-40"
                                            : isSelected
                                                ? "bg-[var(--text-primary)] text-[var(--app-bg)] scale-[1.05] z-10 shadow-xl"
                                                : isHinted
                                                    ? "bg-amber-400/20 text-[var(--text-primary)]"
                                                    : "bg-[var(--glass-bg)] hover:bg-[var(--glass-bg)]/80 text-[var(--text-primary)]"
                                            }`}
                                    >
                                        {!isBlack && cellNumber && (
                                            <span className="absolute top-1 left-1.5 text-[10px] font-black text-[var(--text-secondary)] opacity-50">
                                                {cellNumber}
                                            </span>
                                        )}
                                        {!isBlack && userGrid[rowIndex][colIndex]}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Clues */}
                <div className="space-y-6">
                    <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-[2rem] p-6 space-y-4 shadow-xl">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--text-secondary)] opacity-40">Across</h3>
                        <div className="space-y-3 text-sm max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                            {puzzle.clues.across.map((clue) => (
                                <div key={clue.number} className="text-[var(--text-primary)] leading-relaxed">
                                    <span className="font-black text-cyan-500 mr-2">{clue.number}.</span> {clue.clue}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-[2rem] p-6 space-y-4 shadow-xl">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--text-secondary)] opacity-40">Down</h3>
                        <div className="space-y-3 text-sm max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                            {puzzle.clues.down.map((clue) => (
                                <div key={clue.number} className="text-[var(--text-primary)] leading-relaxed">
                                    <span className="font-black text-fuchsia-500 mr-2">{clue.number}.</span> {clue.clue}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {completed && (
                <div className="text-center py-4">
                    <p className="text-2xl font-bold text-emerald-400">🎉 Puzzle Completed!</p>
                </div>
            )}
        </div>
    );
}
