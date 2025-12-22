"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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

const familyCards = [
    {
        id: "polygonle",
        title: "Polygonle / Shape-Logic",
        eyebrow: "🔷 Constraint-first shapes",
        gradient: "from-blue-700/50 via-indigo-700/20 to-zinc-950",
        description: "Constraint-reveal play for people who love hidden schemas and geometric cognition.",
        images: [
            "https://www.polygonle.com/banner1200.png?1=&utm_source=chatgpt.com",
            "https://m.media-amazon.com/images/I/71vJ67RVBZL._AC_UF894%2C1000_QL80_.jpg?utm_source=chatgpt.com",
            "https://i.ytimg.com/vi/loyetRWK3VU/sddefault.jpg?utm_source=chatgpt.com",
        ],
        spins: [
            "Constraint-Reveal Polygonle — guesses unlock hidden rules (convexity, symmetry, mirror days).",
            "Multi-Objective Polygonle — solve the shape and optimize area/perimeter/rotational symmetry.",
            "Time-Shift Polygonle — daily rule shifts (mirror-only, no acute angles, adversarial days).",
            "Adversarial Polygonle — one player seeds constraints; the rest deduce the rule-set.",
            "Generative Polygonle — players design puzzles; others rate elegance and solvability.",
        ],
    },
    {
        id: "sudoku",
        title: "Sudoku / Smart Sudoku",
        eyebrow: "🧩 Explain-your-move logic",
        gradient: "from-emerald-600/50 via-teal-700/30 to-zinc-950",
        description: "Sudoku that rewards clarity, probabilistic thinking, and mid-run mutations.",
        images: [
            "https://m.media-amazon.com/images/I/71404eM3uYL._AC_UF1000%2C1000_QL80_.jpg?utm_source=chatgpt.com",
            "https://substackcdn.com/image/fetch/%24s_%21cNkR%21%2Cf_auto%2Cq_auto%3Agood%2Cfl_progressive%3Asteep/https%3A%2F%2Fbucketeer-e05bbc84-baa3-437e-9518-adb32be77984.s3.amazonaws.com%2Fpublic%2Fimages%2F53582cc4-2e98-45a4-89da-1b3d5fd61d65_480x480.png?utm_source=chatgpt.com",
            "https://www.brainfreezepuzzles.com/puzzles/Brainfreeze_SimpleRainbow.jpg?utm_source=chatgpt.com",
        ],
        spins: [
            "Explainable Sudoku — every move requires a justification; score clarity, not speed.",
            "Probabilistic Sudoku — cells expose confidence ranges; maximize likelihood while finishing.",
            "Living Sudoku — the grid mutates every few moves (rotate cages, swap regions, new diagonals).",
            "Co-op Sudoku — players solve disjoint regions with partial info; sync for a clean finish.",
            "Sudoku Roguelike — mid-run mods appear (\"no repeats on diagonals for 5 turns\").",
        ],
    },
    {
        id: "wordle",
        title: "Wordle-Like",
        eyebrow: "🟩 Feedback as meaning",
        gradient: "from-purple-600/50 via-pink-600/30 to-zinc-950",
        description: "Word-guessing evolves into semantic, grammatical, and narrative puzzles.",
        images: [
            "https://i.ytimg.com/vi/JyKkEyGwLP4/maxresdefault.jpg?utm_source=chatgpt.com",
            "https://semantle.com/assets/cover.png?utm_source=chatgpt.com",
            "https://ecdn.teacherspayteachers.com/thumbitem/Multilingual-Word-Search-puzzles-worksheet-activity-11524230-1714658768/original-11524230-1.jpg?utm_source=chatgpt.com",
        ],
        spins: [
            "Semantic Wordle — score by meaning proximity instead of letters (hot/cold semantics).",
            "Grammar-Wordle — tense, voice, and part-of-speech correctness matter.",
            "Multi-Language Wordle — daily word exists across languages via shared roots/meaning.",
            "Narrative Wordle — each correct guess unlocks a line of story; finish the arc.",
            "Competitive Wordle Draft — players draft letters/rules before guessing.",
        ],
    },
    {
        id: "crosswords",
        title: "Crosswords (Next-Gen)",
        eyebrow: "📰 Evolving grids",
        gradient: "from-orange-600/50 via-red-600/30 to-zinc-950",
        description: "Crosswords that morph, layer, and argue with you.",
        images: [
            "https://images.wordmint.com/p/Modern_Crossword_1879823.png?utm_source=chatgpt.com",
            "https://images.wordmint.com/p/Music_Themed_Crossword_Puzzle_2327433.png?utm_source=chatgpt.com",
            "https://lingolex.com/cross1.gif?utm_source=chatgpt.com",
        ],
        spins: [
            "Evolving Crosswords — the grid changes as clues are solved.",
            "Thematic Crosswords — each puzzle explores one concept (Water, Time, etc.).",
            "Layered Crosswords — multiple valid solutions; the theme chooses the \"true\" one.",
            "Argument Crosswords — fill answers and connect them into a logical case.",
            "Community-Built Crosswords — crowd-submitted clues assemble the daily puzzle.",
        ],
    },
    {
        id: "mao",
        title: "Mao / Hidden-Rule Social",
        eyebrow: "🃏 Hidden-rule mastery",
        gradient: "from-amber-500/40 via-fuchsia-600/20 to-zinc-950",
        description: "Card-play where rules shift, persist, and narrate themselves over time.",
        images: [
            "https://upload.wikimedia.org/wikipedia/commons/f/f5/Trumf_bunke.JPG?utm_source=chatgpt.com",
            "https://childswork.com/cdn/shop/products/1913A_61d27de1-e32c-43f1-90b2-97aa1a0ac076_700x700.jpg?v=1601385611&utm_source=chatgpt.com",
            "https://m.media-amazon.com/images/I/81JW9t7w9TL._AC_UF894%2C1000_QL80_.jpg?utm_source=chatgpt.com",
        ],
        spins: [
            "Digital Mao with Memory — rules persist across sessions/seasons.",
            "Narrative Mao — rules embody lore; discovering them reveals story.",
            "AI-Referee Mao — enforcement is strict, explanations are opaque.",
            "Reverse Mao — players design rules; the system checks consistency.",
            "Hybrid Mao-UNO — visible cues hide meta-rules underneath.",
        ],
    },
];

const hybridIdeas = [
    "Bingo × Tasks — daily life tasks auto-populate a Bingo board.",
    "Story-Puzzle — solve logic to advance character arcs.",
    "Consulting-Logic Games — MECE trees, SCQA, and Pareto as puzzles.",
    "Explain-Your-Move Games — score clarity and reasoning, not speed.",
    "Community Rule Discovery — Reddit-style meta where players debate rules.",
];

const trendSummary = [
    "Modern puzzle games are shifting from \"find the right answer\" to \"discover the rules, structure, and why.\"",
    "Hidden-rule play (Mao), explainable reasoning (Sudoku++), narrative logic (Wordle → story), and systems thinking (Cognitive-OS) are converging.",
    "Delayed feedback, ambiguity tolerance, and genre-detection are the new mastery skills.",
];

const gamePlaceholders = [
    {
        id: "polygonle",
        label: "Polygonle",
        inspiration: "Constraint-reveal shapes with geometric schemas and Wordle-style feedback.",
        buildNote: "Reuse the existing Polygonle prototype; swap data in from `POLYGONLE_WORDS` or a service.",
    },
    {
        id: "wordle",
        label: "Wordle",
        inspiration: "Classic 5-letter loop; add hard mode and semantic/narrative variants as fast follows.",
        buildNote: "Target word seeded by date hash; keep localStorage for streaks.",
    },
    {
        id: "crossword",
        label: "Crosswords",
        inspiration: "Evolving/thematic grids that reflow as you solve; layer in logic edges later.",
        buildNote: "Start with the mini 5x5; add dynamic clues and grid morphing hooks.",
    },
    {
        id: "sudoku",
        label: "Sudoku / Smart Sudoku",
        inspiration: "Explain-your-move, probabilistic cells, and mutating cages mid-run.",
        buildNote: "Scaffold a 9x9 grid component and slot justification + mutation hooks.",
    },
    {
        id: "mao",
        label: "Mao / Hidden-Rule",
        inspiration: "Digital Mao with memory, AI ref, and narrative rule discovery.",
        buildNote: "Start with card-render + penalty feedback; rules live in a server-configured pack.",
    },
    {
        id: "hybrid",
        label: "Hybrids",
        inspiration: "Genre inference + delayed feedback + cognitive weather for systems-thinking.",
        buildNote: "Stub a shared engine for weather modifiers and world detection.",
    },
];

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

export default function GamesPage() {
    const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);
    const polygonleTarget = useMemo(() => pickWordForDate(todayKey, POLYGONLE_WORDS), [todayKey]);
    const wordleTarget = useMemo(() => pickWordForDate(todayKey, WORDLE_WORDS), [todayKey]);
    const [activePrototype, setActivePrototype] = useState<"polygonle" | "wordle" | "crossword">("polygonle");
    const [crosswordTopic, setCrosswordTopic] = useState("general knowledge");
    const [crosswordDifficulty, setCrosswordDifficulty] = useState("medium");
    const [selectedPlaceholder, setSelectedPlaceholder] = useState(gamePlaceholders[0].id);

    const prototypeOptions = useMemo(
        () => [
            {
                id: "polygonle" as const,
                label: "Polygonle (Constraint Reveal)",
                description: "Geometric schema + Wordle feedback for repetition-spotting brains.",
                element: <PolygonleGame target={polygonleTarget} />,
            },
            {
                id: "wordle" as const,
                label: "Wordle (Classic Feel)",
                description: "Simple five-letter daily with local streak memory.",
                element: <WordleGame target={wordleTarget} />,
            },
            {
                id: "crossword" as const,
                label: "Crossword (5x5 mini)",
                description: "Date-seeded mini crossword with quick topic/difficulty knobs.",
                element: (
                    <>
                        <div className="grid sm:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50">
                                    Topic
                                </label>
                                <input
                                    type="text"
                                    value={crosswordTopic}
                                    onChange={(event) => setCrosswordTopic(event.target.value)}
                                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white placeholder:text-white/30 focus:border-white/40 outline-none transition"
                                    placeholder="Science, movies, systems..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50">
                                    Difficulty
                                </label>
                                <select
                                    value={crosswordDifficulty}
                                    onChange={(event) => setCrosswordDifficulty(event.target.value)}
                                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white focus:border-white/40 outline-none transition appearance-none"
                                >
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>
                        </div>
                        <CrosswordGame topic={crosswordTopic} difficulty={crosswordDifficulty} />
                    </>
                ),
            },
        ],
        [crosswordDifficulty, crosswordTopic, polygonleTarget, wordleTarget],
    );

    const activePrototypeConfig =
        prototypeOptions.find((prototype) => prototype.id === activePrototype) ?? prototypeOptions[0];
    const activePlaceholderConfig =
        gamePlaceholders.find((game) => game.id === selectedPlaceholder) ?? gamePlaceholders[0];

    return (
        <div className="min-h-screen bg-black text-white px-6 py-12 transition-colors duration-500">
            <div className="max-w-6xl mx-auto space-y-12">
                <header className="space-y-6 text-center">
                    <p className="text-[14px] font-bold uppercase tracking-[0.6em] text-blue-500">Nu Games Lab</p>
                    <h1 className="text-6xl sm:text-7xl font-extrabold tracking-tighter leading-[1.05]">
                        Modern puzzles for rule-discovery brains
                    </h1>
                    <p className="text-lg text-white/70 max-w-3xl mx-auto">
                        Cleaned up with Apple Style gradients and Hybrid Protocol docks. The new takes lean into hidden
                        rules, semantic feedback, and social meta-play.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                        <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/70">
                            Rules-first
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/70">
                            Visionary
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/70">
                            Playable today
                        </span>
                    </div>
                </header>

                <section className="rounded-[3rem] border border-white/10 bg-gradient-to-br from-white/5 via-white/0 to-white/10 p-10 space-y-8 backdrop-blur-2xl shadow-2xl">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.6em] text-white/40">
                                Playable prototypes
                            </p>
                            <h2 className="text-3xl sm:text-4xl font-black tracking-tighter">Touch it today</h2>
                            <p className="text-white/70 mt-2">
                                Three quick demos to feel the vibe. Daily targets hash off today’s date.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {prototypeOptions.map((prototype) => (
                                <button
                                    key={prototype.id}
                                    type="button"
                                    onClick={() => setActivePrototype(prototype.id)}
                                    className={`rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.3em] border transition ${
                                        activePrototype === prototype.id
                                            ? "border-white bg-white text-black shadow-lg"
                                            : "border-white/10 bg-white/5 text-white/70 hover:border-white/40"
                                    }`}
                                >
                                    {prototype.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <p className="text-sm text-white/70 leading-relaxed max-w-3xl">
                        {activePrototypeConfig.description}
                    </p>
                    <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-8 shadow-inner">
                        {activePrototypeConfig.element}
                    </div>
                </section>

                <section className="rounded-[3rem] border border-white/10 bg-gradient-to-br from-white/10 via-white/0 to-white/5 p-10 space-y-8 backdrop-blur-2xl shadow-2xl">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.6em] text-white/40">
                                All games scaffold
                            </p>
                            <h2 className="text-3xl sm:text-4xl font-black tracking-tighter">Pick any game, drop code</h2>
                            <p className="text-white/70 mt-2">
                                Placeholder shells so Polygonle, Wordle, Crosswords, Sudoku, Mao, and more can ship fast.
                            </p>
                        </div>
                        <select
                            value={selectedPlaceholder}
                            onChange={(event) => setSelectedPlaceholder(event.target.value)}
                            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-black uppercase tracking-[0.3em] text-white/80 focus:border-white/40 outline-none"
                        >
                            {gamePlaceholders.map((game) => (
                                <option key={game.id} value={game.id}>
                                    {game.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-8 shadow-inner space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60">
                                Inspiration
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-white/80">
                                Placeholder
                            </span>
                        </div>
                        <h3 className="text-3xl font-black tracking-tighter">{activePlaceholderConfig.label}</h3>
                        <p className="text-white/80">{activePlaceholderConfig.inspiration}</p>
                        <div className="rounded-2xl border border-dashed border-white/20 bg-black/30 p-4 text-sm text-white/70">
                            <p className="font-semibold uppercase tracking-[0.2em] text-[11px] mb-2">
                                Implementation note
                            </p>
                            <p className="leading-relaxed">{activePlaceholderConfig.buildNote}</p>
                            <p className="mt-3 text-white/60 text-xs">
                                Placeholder view: drop your component into <code>src/app/(tabs)/games</code> and wire it here.
                                Keep this section as the inspiration stub per game.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="rounded-[3rem] border border-white/10 bg-gradient-to-br from-white/10 via-white/0 to-white/5 p-10 space-y-6 backdrop-blur-2xl shadow-2xl">
                    <p className="text-[10px] font-black uppercase tracking-[0.6em] text-white/50">Big trend summary</p>
                    <div className="grid gap-8 lg:grid-cols-3">
                        {trendSummary.map((item) => (
                            <div
                                key={item}
                                className="rounded-[2rem] border border-white/10 bg-white/5 p-6 text-sm text-white/80 shadow-inner"
                            >
                                {item}
                            </div>
                        ))}
                    </div>
                    <div className="rounded-[2rem] border border-white/10 bg-gradient-to-r from-blue-600/30 via-indigo-700/30 to-purple-700/30 p-6">
                        <p className="text-[12px] font-black uppercase tracking-[0.5em] text-white/70">Core creative leap</p>
                        <p className="mt-3 text-lg font-semibold text-white">
                            Games where the objective is not to solve the puzzle, but to correctly infer what kind of game
                            you are in — genre detection, delayed feedback, and systems thinking by feel.
                        </p>
                    </div>
                </section>

                <section className="space-y-6">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.6em] text-white/40">
                                Modern takes
                            </p>
                            <h2 className="text-3xl sm:text-4xl font-black tracking-tighter">Game families, refreshed</h2>
                        </div>
                        <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/70">
                            Discovery-first
                        </span>
                    </div>
                    <div className="grid gap-6 lg:grid-cols-2">
                        {familyCards.map((family) => (
                            <article
                                key={family.id}
                                className={`rounded-[2.5rem] border border-white/10 bg-gradient-to-br ${family.gradient} p-6 sm:p-8 space-y-5 shadow-xl backdrop-blur-2xl`}
                            >
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60">
                                        {family.eyebrow}
                                    </span>
                                    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-white/80">
                                        Original
                                    </span>
                                </div>
                                <h3 className="text-3xl font-black tracking-tighter">{family.title}</h3>
                                <p className="text-base text-white/80 leading-relaxed">{family.description}</p>
                                <div className="grid grid-cols-3 gap-3">
                                    {family.images.map((src) => (
                                        <img
                                            key={src}
                                            src={src}
                                            alt={family.title}
                                            className="h-24 w-full rounded-2xl border border-white/10 object-cover"
                                        />
                                    ))}
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60">
                                        Modern spins
                                    </p>
                                    <ul className="space-y-2 text-sm text-white/80 leading-relaxed">
                                        {family.spins.map((spin) => (
                                            <li key={spin} className="flex gap-2">
                                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white/60 flex-shrink-0" />
                                                <span>{spin}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="rounded-[3rem] border border-white/10 bg-gradient-to-br from-white/10 via-white/0 to-white/5 p-10 space-y-6 backdrop-blur-2xl shadow-2xl">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.6em] text-white/40">
                                Cross-genre hybrids
                            </p>
                            <h2 className="text-3xl sm:text-4xl font-black tracking-tighter">Very \"you\" experiments</h2>
                            <p className="mt-3 text-white/70">
                                Designed for Cognitive-OS: ambiguity tolerance, explainability, and community meta-play.
                            </p>
                        </div>
                        <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/70">
                            Systems-first
                        </span>
                    </div>
                    <ul className="space-y-3 text-base text-white/80">
                        {hybridIdeas.map((idea) => (
                            <li key={idea} className="flex gap-2">
                                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-white/70 flex-shrink-0" />
                                <span>{idea}</span>
                            </li>
                        ))}
                    </ul>
                    <div className="rounded-[2rem] border border-white/10 bg-gradient-to-r from-blue-600/40 via-emerald-600/30 to-purple-600/30 p-6 space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60">Social layer</p>
                        <p className="text-white font-semibold">
                            No leaderboards; you get distribution curves and reasoning style clusters — "you reason like
                            12% of players today."
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
}
