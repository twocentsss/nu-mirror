"use client";

import { FormEvent, useMemo, useState, useEffect } from "react";
import CrosswordGame from "@/components/games/CrosswordGame";

type TileStatus = "correct" | "present" | "absent";
type GuessRecord = {
    guess: string;
    statuses: TileStatus[];
};

const MAX_ATTEMPTS = 6;

const WORDLE_WORDS = [
    "APPLE",
    "BREAD",
    "CHAIR",
    "DANCE",
    "EAGER",
    "FAITH",
    "GRAPE",
    "HOUSE",
    "IMAGE",
    "JOKER",
    "KNIFE",
    "LEMON",
    "MANGO",
    "NIGHT",
    "OCEAN",
];

const POLYGONLE_WORDS = [
    "BANANA",
    "APPEAL",
    "COFFEE",
    "DAPPER",
    "EASIER",
    "FOLLOW",
    "GIGGLE",
    "HAPPEN",
    "INDENT",
    "JUGGLE",
];

const POLYGON_SHAPES = [
    { symbol: "△", name: "Triangle" },
    { symbol: "□", name: "Square" },
    { symbol: "▽", name: "Inverted Triangle" },
    { symbol: "◇", name: "Diamond" },
    { symbol: "⬟", name: "Heptagon" },
    { symbol: "⬢", name: "Hexagon" },
    { symbol: "⬡", name: "Hexagon (alt)" },
    { symbol: "⬠", name: "Pentagon" },
];

const TILE_CLASSES: Record<TileStatus, string> = {
    correct: "bg-emerald-500 text-white border-transparent shadow-[0_0_15px_rgba(16,185,129,0.3)]",
    present: "bg-yellow-500 text-white border-transparent shadow-[0_0_15px_rgba(234,179,8,0.3)]",
    absent: "bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--text-secondary)]",
};

const emptyTileClass = "bg-[var(--glass-bg)]/40 border-[var(--glass-border)] text-[var(--text-secondary)]/30";

function hashString(value: string) {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
        hash = (hash * 31 + value.charCodeAt(i)) % 1_000_000_000;
    }
    return Math.abs(hash);
}

function pickWordForDate(dateKey: string, list: string[]) {
    const hash = hashString(dateKey);
    return list[hash % list.length];
}

function evaluateGuess(target: string, guess: string): TileStatus[] {
    const statuses: TileStatus[] = Array(target.length).fill("absent");
    const remaining: Record<string, number> = {};
    for (const char of target) {
        remaining[char] = (remaining[char] ?? 0) + 1;
    }

    for (let i = 0; i < target.length; i += 1) {
        if (guess[i] === target[i]) {
            statuses[i] = "correct";
            remaining[guess[i]] -= 1;
        }
    }

    for (let i = 0; i < target.length; i += 1) {
        if (statuses[i] === "correct") continue;
        const letter = guess[i];
        if (remaining[letter] > 0) {
            statuses[i] = "present";
            remaining[letter] -= 1;
        }
    }

    return statuses;
}

function buildPolygonBlueprint(word: string) {
    const mapping = new Map<string, { symbol: string; name: string }>();
    const sequence: { symbol: string; name: string }[] = [];
    let shapeIndex = 0;

    for (const char of word) {
        if (!mapping.has(char)) {
            mapping.set(char, POLYGON_SHAPES[shapeIndex % POLYGON_SHAPES.length]);
            shapeIndex += 1;
        }
        sequence.push(mapping.get(char)!);
    }

    return { mapping, sequence };
}

function GameGrid({ length, history }: { length: number; history: GuessRecord[] }) {
    return (
        <div className="space-y-2">
            {Array.from({ length: MAX_ATTEMPTS }).map((_, rowIndex) => {
                const entry = history[rowIndex];
                const letters = entry?.guess ?? "";

                return (
                    <div
                        key={`row-${rowIndex}`}
                        className="grid gap-2"
                        style={{ gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))` }}
                    >
                        {Array.from({ length }).map((__, columnIndex) => {
                            const letter = letters[columnIndex] ?? "";
                            const status = entry?.statuses[columnIndex] as TileStatus | undefined;
                            const tileClass = status ? TILE_CLASSES[status] : emptyTileClass;

                            return (
                                <div
                                    key={`tile-${rowIndex}-${columnIndex}`}
                                    className={`aspect-square flex items-center justify-center rounded-xl text-2xl font-black tracking-[0.2em] uppercase border transition ${tileClass}`}
                                >
                                    {letter || ""}
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
}

function WordleGame({ target }: { target: string }) {
    const [guess, setGuess] = useState("");
    const [history, setHistory] = useState<GuessRecord[]>([]);
    const [message, setMessage] = useState<string | null>(null);

    const finished = history.some((entry) => entry.statuses.every((status) => status === "correct"));
    const attemptsLeft = MAX_ATTEMPTS - history.length;

    // Load from localStorage on mount
    useEffect(() => {
        const dailyKey = `wordle_${target}`;
        const saved = localStorage.getItem(dailyKey);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                setHistory(data.history || []);
                setMessage(data.message || null);
            } catch (err) {
                console.error("Failed to load saved game:", err);
            }
        }
    }, [target]);

    // Save to localStorage whenever state changes
    useEffect(() => {
        const dailyKey = `wordle_${target}`;
        localStorage.setItem(dailyKey, JSON.stringify({ history, message }));
    }, [history, message, target]);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (finished || history.length >= MAX_ATTEMPTS) return;

        const candidate = guess.trim().toUpperCase();
        if (candidate.length !== target.length) {
            setMessage(`Guess must be exactly ${target.length} letters.`);
            return;
        }

        if (!/^[A-Z]+$/.test(candidate)) {
            setMessage("Only alphabetic characters are allowed.");
            return;
        }

        const statuses = evaluateGuess(target, candidate);
        const nextHistory = [...history, { guess: candidate, statuses }];
        setHistory(nextHistory);
        setGuess("");

        if (candidate === target) {
            setMessage(`🎉 Wordle cracked in ${nextHistory.length} guesses!`);
            return;
        }

        if (nextHistory.length >= MAX_ATTEMPTS) {
            setMessage(`Game Over. The word was ${target}.`);
            return;
        }

        setMessage(null);
    };

    return (
        <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.5em] text-[var(--text-secondary)]">5-letter Wordle</p>

            {/* Input moved to top */}
            <div className="flex flex-col gap-2">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        value={guess}
                        onChange={(event) => setGuess(event.target.value.toUpperCase())}
                        disabled={finished || history.length >= MAX_ATTEMPTS}
                        maxLength={target.length}
                        className="flex-1 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-lg font-bold tracking-[0.3em] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]/30 focus:border-cyan-400 transition-all"
                        placeholder="GUESS"
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={finished || history.length >= MAX_ATTEMPTS}
                        className="rounded-2xl bg-cyan-500 px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-950 disabled:opacity-40 hover:scale-105 active:scale-95 transition-all shadow-lg"
                    >
                        Guess
                    </button>
                </form>
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-40">
                    Attempts left: {attemptsLeft} / {MAX_ATTEMPTS}
                </p>
                {message && <p className="text-sm font-bold text-cyan-400 drop-shadow-md">{message}</p>}
            </div>

            <GameGrid length={target.length} history={history} />
        </div>
    );
}

function PolygonleGame({ target }: { target: string }) {
    const blueprint = useMemo(() => buildPolygonBlueprint(target), [target]);
    const [guess, setGuess] = useState("");
    const [history, setHistory] = useState<GuessRecord[]>([]);
    const [message, setMessage] = useState<string | null>(null);

    const finished = history.some((entry) => entry.statuses.every((status) => status === "correct"));
    const attemptsLeft = MAX_ATTEMPTS - history.length;

    // Load from localStorage on mount
    useEffect(() => {
        const dailyKey = `polygonle_${target}`;
        const saved = localStorage.getItem(dailyKey);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                setHistory(data.history || []);
                setMessage(data.message || null);
            } catch (err) {
                console.error("Failed to load saved game:", err);
            }
        }
    }, [target]);

    // Save to localStorage whenever state changes
    useEffect(() => {
        const dailyKey = `polygonle_${target}`;
        localStorage.setItem(dailyKey, JSON.stringify({ history, message }));
    }, [history, message, target]);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (finished || history.length >= MAX_ATTEMPTS) return;

        const candidate = guess.trim().toUpperCase();
        if (candidate.length !== target.length) {
            setMessage(`Guess must be ${target.length} letters long.`);
            return;
        }

        if (!/^[A-Z]+$/.test(candidate)) {
            setMessage("Only alphabetic characters are allowed.");
            return;
        }

        const statuses = evaluateGuess(target, candidate);
        const nextHistory = [...history, { guess: candidate, statuses }];
        setHistory(nextHistory);
        setGuess("");

        if (candidate === target) {
            setMessage(`✔ Polygonle cracked in ${nextHistory.length} guesses!`);
            return;
        }

        if (nextHistory.length >= MAX_ATTEMPTS) {
            setMessage(`Game Over. The secret word was ${target}.`);
            return;
        }

        setMessage(null);
    };

    return (
        <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.5em] text-[var(--text-secondary)]">Polygonle schema</p>

            {/* Input moved to top */}
            <div className="flex flex-col gap-2">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        value={guess}
                        onChange={(event) => setGuess(event.target.value.toUpperCase())}
                        disabled={finished || history.length >= MAX_ATTEMPTS}
                        maxLength={target.length}
                        className="flex-1 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-lg font-bold tracking-[0.3em] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]/30 focus:border-fuchsia-500 transition-all"
                        placeholder={`${target.length}-letter guess`}
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={finished || history.length >= MAX_ATTEMPTS}
                        className="rounded-2xl bg-fuchsia-500 px-4 py-2 text-xs font-black uppercase tracking-widest text-white disabled:opacity-40 hover:scale-105 active:scale-95 transition-all shadow-lg"
                    >
                        Guess
                    </button>
                </form>
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-40">
                    Attempts left: {attemptsLeft} / {MAX_ATTEMPTS}
                </p>
                {message && <p className="text-sm font-bold text-fuchsia-400 drop-shadow-md">{message}</p>}
            </div>

            <div className="flex flex-wrap gap-3">
                {blueprint.sequence.map((shape, index) => (
                    <div key={`shape-${index}`} className="flex flex-col items-center gap-1 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] px-3 py-2 text-xs uppercase tracking-[0.2em] shadow-lg">
                        <span className="text-2xl">{shape.symbol}</span>
                        <span className="text-[10px] text-[var(--text-secondary)]">{shape.name}</span>
                    </div>
                ))}
            </div>

            <div className="text-[11px] text-[var(--text-secondary)]">
                {Array.from(blueprint.mapping.entries()).map(([letter, shape]) => (
                    <span key={`legend-${letter}`} className="mr-3 inline-flex items-center gap-1 opacity-60">
                        <span className="text-lg">{shape.symbol}</span>
                        {letter}
                    </span>
                ))}
            </div>

            <GameGrid length={target.length} history={history} />
        </div>
    );
}

const games = [
    {
        id: "polygonle",
        label: "Polygonle",
        hero: "Word-guessing with geometric hints",
        blurb:
            "Players see a shape sequence that encodes repeated letters before guessing a 6-8 letter word. Momentum is the shape schema, rhythm is the pattern.",
        steps: [
            "Pick a word from the curated list (6-8 letters) or seed the list via AI / Gemini prompts.",
            "Map every distinct letter to a unique polygon (triangle, square, pentagon…) and render the sequence.",
            "Let players guess up to 6 times, validating each guess against an English list.",
            "Color feedback Wordle-style (green/yellow/gray) but prefix it with the repeating shape clue.",
            "Highlight wins and reveal the target word when attempts are exhausted.",
        ],
        suggestion:
            "Seed the daily puzzle with a date hash; ensure the chosen word has 2-4 unique letters for fun repetitions.",
    },
    {
        id: "wordle",
        label: "Wordle",
        hero: "Classic 5-letter guessing ritual",
        blurb:
            "Select a five-letter word and let humans chase the feedback grid for green, yellow, and gray tiles.",
        steps: [
            "Seed the daily target from a managed 5-letter dictionary or expand it via AI.",
            "Require six attempts, validating each guess via dictionary lookup.",
            "Check exact matches first (green), then partial matches (yellow) while tracking letter counts.",
            "Display a growing grid of colored tiles so players track progress.",
            "Offer win/lose feedback and optionally a hard mode that enforces previous clues.",
        ],
        suggestion:
            "Call out repeated letters explicitly in the grid and highlight which rule (shelved, reused) drove the color.",
    },
    {
        id: "crossword",
        label: "Random Daily Crossword",
        hero: "Mini 5x5 crossword builder",
        blurb:
            "Generate a compact grid with short across/down entries and clues, seeded by date and backed by AI for word/clue variety.",
        steps: [
            "Pick a symmetric 5x5 layout with a handful of black squares and number the word starts.",
            "Slot words using a small curated dictionary, then expand via AI when the pool runs dry.",
            "Respect regex constraints when filling intersections; backtrack if a slot cannot be satisfied.",
            "Attach clues from your list or AI prompts (e.g., \"Feline pet\" for CAT).",
            "Render the grid with clue lists and let the player fill letters; validate on submit.",
        ],
        suggestion:
            "Use AI like Gemini to provide themed words/clues and keep the daily puzzle fresh.",
    },
];

export default function GamesPage() {
    const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);
    const selectedDate = useMemo(
        () => new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        [],
    );
    const [selectedGame, setSelectedGame] = useState(games[0].id);
    const activeGame = useMemo(() => games.find((game) => game.id === selectedGame) ?? games[0], [selectedGame]);
    const polygonleTarget = useMemo(() => pickWordForDate(todayKey, POLYGONLE_WORDS), [todayKey]);
    const wordleTarget = useMemo(() => pickWordForDate(todayKey, WORDLE_WORDS), [todayKey]);

    // Crossword configuration
    const [crosswordTopic, setCrosswordTopic] = useState("general knowledge");
    const [crosswordDifficulty, setCrosswordDifficulty] = useState("medium");

    return (
        <div className="min-h-screen bg-[var(--app-bg)] text-[var(--text-primary)] px-6 py-12 transition-colors duration-500">
            <div className="max-w-5xl mx-auto space-y-8">
                <header className="space-y-4 text-center">
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none mb-4">Playground</h1>
                    <p className="text-sm uppercase tracking-[0.5em] text-[var(--text-secondary)] opacity-60">Pick a daily mind-bender</p>
                    <p className="text-xs text-[var(--text-secondary)] uppercase tracking-[0.4em] mt-2">
                        {selectedDate} puzzles
                    </p>
                </header>

                <section className="flex flex-col gap-2 items-center">
                    <label className="text-[10px] font-black tracking-[0.4em] uppercase text-[var(--text-secondary)] opacity-40">Choose a game</label>
                    <select
                        value={selectedGame}
                        onChange={(event) => setSelectedGame(event.target.value)}
                        className="w-full max-w-sm rounded-[2rem] border border-[var(--glass-border)] bg-[var(--glass-bg)] px-6 py-4 text-sm font-black tracking-tight text-[var(--text-primary)] outline-none transition-all focus:border-[var(--text-primary)] focus:bg-[var(--glass-bg)]/80 appearance-none text-center"
                    >
                        {games.map((game) => (
                            <option key={game.id} value={game.id}>
                                {game.label}
                            </option>
                        ))}
                    </select>
                </section>

                <section className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-[3rem] p-10 space-y-8 shadow-2xl backdrop-blur-3xl">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[var(--text-secondary)] opacity-40">Now playing</p>
                        <h2 className="text-4xl font-black tracking-tighter text-[var(--text-primary)] mt-2">{activeGame.label}</h2>
                        <p className="text-lg font-medium text-[var(--text-secondary)] mt-4 leading-relaxed">{activeGame.hero}</p>
                    </div>

                    <p className="text-base text-[var(--text-secondary)] leading-relaxed">{activeGame.blurb}</p>

                    <div className="space-y-4 pt-4 border-t border-[var(--glass-border)]">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--text-secondary)] opacity-40">Algorithm outline</p>
                        <ol className="list-decimal list-inside space-y-3 text-base text-[var(--text-secondary)]">
                            {activeGame.steps.map((step) => (
                                <li key={step} className="pl-2 leading-relaxed font-medium">
                                    {step}
                                </li>
                            ))}
                        </ol>
                    </div>

                    <div className="p-6 rounded-[2rem] bg-gradient-to-br from-[var(--glass-bg)] to-[var(--glass-bg)]/50 border border-[var(--glass-border)] shadow-inner">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--text-secondary)] opacity-60">Bonus notes</p>
                        <p className="text-sm font-medium text-[var(--text-primary)] mt-2 leading-relaxed">{activeGame.suggestion}</p>
                    </div>
                </section>

                {selectedGame === "polygonle" && (
                    <section className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-[3rem] p-10 space-y-6 shadow-2xl backdrop-blur-3xl">
                        <PolygonleGame target={polygonleTarget} />
                    </section>
                )}

                {selectedGame === "wordle" && (
                    <section className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-[3rem] p-10 space-y-6 shadow-2xl backdrop-blur-3xl">
                        <WordleGame target={wordleTarget} />
                    </section>
                )}

                {selectedGame === "crossword" && (
                    <>
                        <section className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-[2.5rem] p-8 space-y-6 backdrop-blur-3xl">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--text-secondary)] opacity-40">Configure Puzzle</p>
                            <div className="grid sm:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-60">Topic</label>
                                    <input
                                        type="text"
                                        value={crosswordTopic}
                                        onChange={(e) => setCrosswordTopic(e.target.value)}
                                        placeholder="e.g., Science, Movies, Sports"
                                        className="w-full px-6 py-4 bg-[var(--app-bg)] border border-[var(--glass-border)] rounded-2xl text-sm font-bold text-[var(--text-primary)] focus:border-[var(--text-primary)] outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-60">Difficulty</label>
                                    <select
                                        value={crosswordDifficulty}
                                        onChange={(e) => setCrosswordDifficulty(e.target.value)}
                                        className="w-full px-6 py-4 bg-[var(--app-bg)] border border-[var(--glass-border)] rounded-2xl text-sm font-bold text-[var(--text-primary)] focus:border-[var(--text-primary)] outline-none transition-all appearance-none"
                                    >
                                        <option value="easy">Easy</option>
                                        <option value="medium">Medium</option>
                                        <option value="hard">Hard</option>
                                    </select>
                                </div>
                            </div>
                        </section>
                        <section className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-[3rem] p-10 space-y-6 shadow-2xl backdrop-blur-3xl">
                            <CrosswordGame topic={crosswordTopic} difficulty={crosswordDifficulty} />
                        </section>
                    </>
                )}

                <section className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-[2.5rem] p-8 space-y-4 text-sm text-[var(--text-secondary)] backdrop-blur-xl">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--text-secondary)] opacity-60">Bonus concepts</p>
                    <ul className="list-disc list-inside space-y-2 opacity-80 font-medium">
                        <li>Numerangle – substitute geometric angles for digits to encode repeated numbers.</li>
                        <li>Syllable – guess five-syllable phrases with syllable-focused feedback instead of letters.</li>
                        <li>MazeCross – fill a 5x5 maze grid where word paths wind around walls and intersection hints help.</li>
                    </ul>
                </section>
            </div>
        </div>
    );
}
