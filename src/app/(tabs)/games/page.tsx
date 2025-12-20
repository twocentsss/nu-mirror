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
    correct: "bg-emerald-500 text-white border-transparent",
    present: "bg-yellow-400 text-slate-900 border-transparent",
    absent: "bg-slate-900 text-white border border-slate-700",
};

const emptyTileClass = "bg-slate-950/40 border border-slate-900 text-slate-500";

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
            <p className="text-xs uppercase tracking-[0.5em] text-slate-400">5-letter Wordle</p>

            {/* Input moved to top */}
            <div className="flex flex-col gap-2">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        value={guess}
                        onChange={(event) => setGuess(event.target.value.toUpperCase())}
                        disabled={finished || history.length >= MAX_ATTEMPTS}
                        maxLength={target.length}
                        className="flex-1 rounded-2xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-lg font-bold tracking-[0.3em] text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
                        placeholder="GUESS"
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={finished || history.length >= MAX_ATTEMPTS}
                        className="rounded-2xl bg-cyan-500 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-950 disabled:opacity-60"
                    >
                        Guess
                    </button>
                </form>
                <p className="text-xs text-slate-400">
                    Attempts left: {attemptsLeft} / {MAX_ATTEMPTS}
                </p>
                {message && <p className="text-sm font-semibold text-cyan-300">{message}</p>}
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
            <p className="text-xs uppercase tracking-[0.5em] text-slate-400">Polygonle schema</p>

            {/* Input moved to top */}
            <div className="flex flex-col gap-2">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        value={guess}
                        onChange={(event) => setGuess(event.target.value.toUpperCase())}
                        disabled={finished || history.length >= MAX_ATTEMPTS}
                        maxLength={target.length}
                        className="flex-1 rounded-2xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-lg font-bold tracking-[0.3em] text-white outline-none placeholder:text-slate-500 focus:border-fuchsia-500"
                        placeholder={`${target.length}-letter guess`}
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={finished || history.length >= MAX_ATTEMPTS}
                        className="rounded-2xl bg-fuchsia-500 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white disabled:opacity-60"
                    >
                        Guess
                    </button>
                </form>
                <p className="text-xs text-slate-400">
                    Attempts left: {attemptsLeft} / {MAX_ATTEMPTS}
                </p>
                {message && <p className="text-sm font-semibold text-fuchsia-200">{message}</p>}
            </div>

            <div className="flex flex-wrap gap-3">
                {blueprint.sequence.map((shape, index) => (
                    <div key={`shape-${index}`} className="flex flex-col items-center gap-1 rounded-2xl bg-slate-900/60 px-3 py-2 text-xs uppercase tracking-[0.2em]">
                        <span className="text-2xl">{shape.symbol}</span>
                        <span className="text-[10px] text-slate-400">{shape.name}</span>
                    </div>
                ))}
            </div>

            <div className="text-[11px] text-slate-400">
                {Array.from(blueprint.mapping.entries()).map(([letter, shape]) => (
                    <span key={`legend-${letter}`} className="mr-3 inline-flex items-center gap-1">
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
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950/80 text-white px-6 py-12">
            <div className="max-w-5xl mx-auto space-y-8">
                <header className="space-y-2 text-center">
                    <h1 className="text-4xl font-black tracking-wide">Playground</h1>
                    <p className="text-sm uppercase tracking-[0.5em] text-slate-400">Pick a daily mind-bender</p>
                    <p className="text-xs text-slate-500 uppercase tracking-[0.4em]">
                        {selectedDate} puzzles
                    </p>
                </header>

                <section className="flex flex-col gap-2 items-center">
                    <label className="text-xs italic tracking-widest uppercase text-slate-400">Choose a game</label>
                    <select
                        value={selectedGame}
                        onChange={(event) => setSelectedGame(event.target.value)}
                        className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm font-semibold tracking-tight text-white outline-none transition focus:border-cyan-400"
                    >
                        {games.map((game) => (
                            <option key={game.id} value={game.id}>
                                {game.label}
                            </option>
                        ))}
                    </select>
                </section>

                <section className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
                    <div>
                        <p className="text-xs uppercase tracking-[0.5em] text-slate-400">Now playing</p>
                        <h2 className="text-3xl font-extrabold">{activeGame.label}</h2>
                        <p className="text-sm text-slate-300 mt-2">{activeGame.hero}</p>
                    </div>

                    <p className="text-sm text-slate-200">{activeGame.blurb}</p>

                    <div className="space-y-3">
                        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Algorithm outline</p>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-slate-200">
                            {activeGame.steps.map((step) => (
                                <li key={step} className="pl-1 leading-relaxed">
                                    {step}
                                </li>
                            ))}
                        </ol>
                    </div>

                    <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/50">
                        <p className="text-xs uppercase tracking-[0.4em] text-cyan-200">Bonus notes</p>
                        <p className="text-sm text-cyan-100">{activeGame.suggestion}</p>
                    </div>
                </section>

                {selectedGame === "polygonle" && (
                    <section className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl">
                        <PolygonleGame target={polygonleTarget} />
                    </section>
                )}

                {selectedGame === "wordle" && (
                    <section className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl">
                        <WordleGame target={wordleTarget} />
                    </section>
                )}

                {selectedGame === "crossword" && (
                    <>
                        <section className="bg-slate-900/70 border border-slate-800 rounded-3xl p-4 space-y-4">
                            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Configure Puzzle</p>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-2">Topic</label>
                                    <input
                                        type="text"
                                        value={crosswordTopic}
                                        onChange={(e) => setCrosswordTopic(e.target.value)}
                                        placeholder="e.g., Science, Movies, Sports"
                                        className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white focus:border-sky-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-2">Difficulty</label>
                                    <select
                                        value={crosswordDifficulty}
                                        onChange={(e) => setCrosswordDifficulty(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white focus:border-sky-500 outline-none"
                                    >
                                        <option value="easy">Easy</option>
                                        <option value="medium">Medium</option>
                                        <option value="hard">Hard</option>
                                    </select>
                                </div>
                            </div>
                        </section>
                        <section className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl">
                            <CrosswordGame topic={crosswordTopic} difficulty={crosswordDifficulty} />
                        </section>
                    </>
                )}

                <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-2 text-sm text-slate-300">
                    <p className="font-semibold text-cyan-200">Bonus concepts</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>Numerangle – substitute geometric angles for digits to encode repeated numbers.</li>
                        <li>Syllable – guess five-syllable phrases with syllable-focused feedback instead of letters.</li>
                        <li>MazeCross – fill a 5x5 maze grid where word paths wind around walls and intersection hints help.</li>
                    </ul>
                </section>
            </div>
        </div>
    );
}
