"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import CrosswordGame from "@/components/games/CrosswordGame";

type TileStatus = "correct" | "present" | "absent";
type GuessRecord = {
    guess: string;
    statuses: TileStatus[];
};

type GameType = "wordle" | "polygonle" | "crossword" | "sudoku" | "mao" | "hybrid";
type PrototypeId = GameType;
type AdminGameEntry = {
    id: string;
    type: GameType;
    date: string;
    label: string;
    payload?: string;
};
type GameResult = {
    id: string;
    type: GameType;
    date: string;
    score: number;
    label?: string;
};

type GameInstance = {
    id: string;
    target: string;
    label: string;
    badge: string;
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

const ADMIN_KEY = "nu_games_admin_catalog";
const RESULT_KEY = "nu_games_results";

async function fetchCatalogApi(date: string): Promise<AdminGameEntry[]> {
    try {
        const res = await fetch(`/api/games?date=${date}`);
        if (!res.ok) return [];
        const data = await res.json();
        return data.data ?? [];
    } catch {
        return [];
    }
}

function loadCatalog(): AdminGameEntry[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(ADMIN_KEY);
        return raw ? (JSON.parse(raw) as AdminGameEntry[]) : [];
    } catch {
        return [];
    }
}

function saveCatalog(entries: AdminGameEntry[]) {
    if (typeof window === "undefined") return;
    localStorage.setItem(ADMIN_KEY, JSON.stringify(entries));
}

async function fetchResultsApi(date: string): Promise<GameResult[]> {
    try {
        const res = await fetch(`/api/game-results?date=${date}`);
        if (!res.ok) return [];
        const data = await res.json();
        return data.data ?? [];
    } catch {
        return [];
    }
}

function loadResults(): GameResult[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(RESULT_KEY);
        return raw ? (JSON.parse(raw) as GameResult[]) : [];
    } catch {
        return [];
    }
}

function saveResults(entries: GameResult[]) {
    if (typeof window === "undefined") return;
    localStorage.setItem(RESULT_KEY, JSON.stringify(entries));
}

function SudokuMini({ badge, onComplete }: { badge: string; onComplete?: (score: number, label?: string) => void }) {
    const initial = useMemo(
        () => [
            [0, 0, 3, 4],
            [3, 4, 0, 0],
            [0, 0, 4, 2],
            [4, 2, 0, 0],
        ],
        [],
    );
    const solution = [
        [2, 1, 3, 4],
        [3, 4, 2, 1],
        [1, 3, 4, 2],
        [4, 2, 1, 3],
    ];
    const [grid, setGrid] = useState(initial);
    const [message, setMessage] = useState<string | null>(null);

    const setValue = (r: number, c: number, value: number) => {
        if (initial[r][c] !== 0) return;
        const next = grid.map((row, ri) => row.map((cell, ci) => (ri === r && ci === c ? value : cell)));
        setGrid(next);
        setMessage(null);
    };

    const validate = () => {
        for (let r = 0; r < 4; r += 1) {
            const row = grid[r];
            const rowSet = new Set(row.filter(Boolean));
            if (rowSet.size !== row.filter(Boolean).length) {
                setMessage("Row has duplicates. Try again.");
                return;
            }
        }
        for (let c = 0; c < 4; c += 1) {
            const col = grid.map((row) => row[c]).filter(Boolean);
            const colSet = new Set(col);
            if (colSet.size !== col.length) {
                setMessage("Column has duplicates. Try again.");
                return;
            }
        }
        const isSolved = grid.every((row, r) => row.every((cell, c) => cell === solution[r][c]));
        if (isSolved) {
            setMessage("Solved! 🎉");
            onComplete?.(100, "Sudoku mini");
        } else {
            setMessage("Looks consistent; keep going.");
        }
    };

    const numberButtons = [1, 2, 3, 4];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.5em] text-white/60">Smart Sudoku (mini)</p>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-white/70">
                    {badge}
                </span>
            </div>
            <div className="grid grid-cols-4 gap-2 rounded-2xl border border-white/10 bg-white/5 p-3">
                {grid.map((row, r) =>
                    row.map((cell, c) => {
                        const fixed = initial[r][c] !== 0;
                        return (
                            <button
                                key={`${r}-${c}`}
                                type="button"
                                onClick={() => !fixed && setValue(r, c, ((cell % 4) + 1) as number)}
                                className={`flex aspect-square items-center justify-center rounded-xl border text-lg font-black ${fixed
                                        ? "border-white/30 bg-white/20 text-white"
                                        : "border-white/15 bg-black/30 text-white/80 hover:border-white/40"
                                    }`}
                            >
                                {cell === 0 ? "" : cell}
                            </button>
                        );
                    }),
                )}
            </div>
            <div className="flex items-center gap-2">
                {numberButtons.map((num) => (
                    <span
                        key={num}
                        className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.3em] text-white/80"
                    >
                        {num}
                    </span>
                ))}
                <button
                    type="button"
                    onClick={validate}
                    className="ml-auto rounded-full border border-white/10 bg-white text-black px-4 py-2 text-[11px] font-black uppercase tracking-[0.3em] shadow"
                >
                    Check
                </button>
            </div>
            {message && <p className="text-sm font-semibold text-white">{message}</p>}
        </div>
    );
}

function MaoRuleGuess({ badge, onComplete }: { badge: string; onComplete?: (score: number, label?: string) => void }) {
    const secret = "play same suit or rank as previous card";
    const [guess, setGuess] = useState("");
    const [status, setStatus] = useState<string | null>(null);
    const [previous, setPrevious] = useState({ rank: "7", suit: "♠" });
    const [play, setPlay] = useState({ rank: "7", suit: "♣" });

    const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    const suits = ["♠", "♥", "♦", "♣"];

    const submitPlay = () => {
        const legal = play.rank === previous.rank || play.suit === previous.suit;
        setStatus(legal ? "No penalty: play accepted." : "Penalty: hidden rule violated.");
        setPrevious(play);
    };

    const submitGuess = () => {
        const normalized = guess.trim().toLowerCase();
        const ok =
            normalized.includes("same suit") ||
            normalized.includes("same rank") ||
            normalized.includes("suit") ||
            normalized.includes("rank");
        if (ok) {
            setStatus("Rule inferred! 🎉");
            onComplete?.(100, "Mao");
        } else {
            setStatus("Not quite. Observe penalties and try again.");
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.5em] text-white/60">Mao (hidden-rule stub)</p>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-white/70">
                    {badge}
                </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-white/50">Previous card</p>
                    <div className="rounded-xl border border-white/20 bg-black/30 px-4 py-2 text-lg font-black">
                        {previous.rank}
                        {previous.suit}
                    </div>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-white/50">Your play</p>
                    <div className="flex gap-2">
                        <select
                            value={play.rank}
                            onChange={(e) => setPlay((p) => ({ ...p, rank: e.target.value }))}
                            className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
                        >
                            {ranks.map((r) => (
                                <option key={r} value={r}>
                                    {r}
                                </option>
                            ))}
                        </select>
                        <select
                            value={play.suit}
                            onChange={(e) => setPlay((p) => ({ ...p, suit: e.target.value }))}
                            className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
                        >
                            {suits.map((suit) => (
                                <option key={suit} value={suit}>
                                    {suit}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={submitPlay}
                    className="ml-auto rounded-full border border-white/10 bg-white text-black px-4 py-2 text-[11px] font-black uppercase tracking-[0.3em] shadow"
                >
                    Play
                </button>
            </div>
            <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/50">Guess the rule</p>
                <div className="flex gap-2">
                    <input
                        value={guess}
                        onChange={(e) => setGuess(e.target.value)}
                        placeholder="Describe the hidden rule"
                        className="flex-1 rounded-2xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40"
                    />
                    <button
                        type="button"
                        onClick={submitGuess}
                        className="rounded-full border border-white/10 bg-white text-black px-4 py-2 text-[11px] font-black uppercase tracking-[0.3em] shadow"
                    >
                        Submit
                    </button>
                </div>
            </div>
            {status && <p className="text-sm font-semibold text-white">{status}</p>}
        </div>
    );
}

function HybridWeatherGame({ badge, onComplete }: { badge: string; onComplete?: (score: number, label?: string) => void }) {
    const weathers = ["Fog", "Wind", "Heat", "Cold"];
    const [weather, setWeather] = useState(weathers[0]);
    const [moves, setMoves] = useState(0);
    const [notes, setNotes] = useState<string[]>([]);

    const act = (choice: string) => {
        setMoves((m) => m + 1);
        setNotes((n) => [...n.slice(-4), `${weather} → ${choice}`]);
        const next = weathers[(weathers.indexOf(weather) + 1) % weathers.length];
        setWeather(next);
        if (moves + 1 >= 6) {
            onComplete?.(70 + Math.min(moves * 5, 30), "Hybrid weather");
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.5em] text-white/60">Hybrid / Cognitive Weather</p>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-white/70">
                    {badge}
                </span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/70">Current weather</p>
                <p className="text-3xl font-black">{weather}</p>
                <p className="text-sm text-white/70">Adjust your play based on shifting constraints.</p>
            </div>
            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => act("Hold")}
                    className="rounded-full border border-white/15 bg-black/30 px-4 py-2 text-[11px] font-black uppercase tracking-[0.3em] text-white hover:border-white/40"
                >
                    Hold
                </button>
                <button
                    type="button"
                    onClick={() => act("Probe")}
                    className="rounded-full border border-white/15 bg-black/30 px-4 py-2 text-[11px] font-black uppercase tracking-[0.3em] text-white hover:border-white/40"
                >
                    Probe
                </button>
                <button
                    type="button"
                    onClick={() => act("Commit")}
                    className="rounded-full border border-white/15 bg-black/30 px-4 py-2 text-[11px] font-black uppercase tracking-[0.3em] text-white hover:border-white/40"
                >
                    Commit
                </button>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 space-y-1 text-sm text-white/75 min-h-[72px]">
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/50">Recent moves ({moves})</p>
                {notes.length === 0 ? <p>No moves yet.</p> : notes.map((n) => <p key={n}>{n}</p>)}
            </div>
        </div>
    );
}
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

const gameGovernance = [
    {
        id: "wordle",
        mode: "Daily stateful + infinite practice",
        admin: "Super-admin seeds daily word (AI/Gemini/LLM), publishes to Supabase Postgres, versioned per date.",
        player: "Streak captured per user per day; practice mode is stateless and infinite.",
    },
    {
        id: "polygonle",
        mode: "Daily stateful + infinite practice",
        admin: "Super-admin pulls/generates target words/shapes, stores mapping + schema, publishes daily variant.",
        player: "Streaks + UH score recorded; practice mode is stateless/infinite with no streak impact.",
    },
    {
        id: "crosswords",
        mode: "Daily stateful + archive",
        admin: "Super-admin can ingest/generate grids + clues, store puzzles in Supabase tables, schedule drops.",
        player: "Solve state and streaks persisted; archive mode is stateless browse/play without streaks.",
    },
    {
        id: "sudoku",
        mode: "Daily stateful + infinite generator",
        admin: "Super-admin selects/generates seeds and rule mods (living/probabilistic), publishes per day.",
        player: "Streak + UH score captured; sandbox mode is infinite, stateless, no streak impact.",
    },
    {
        id: "mao",
        mode: "Seasonal stateful",
        admin: "Super-admin defines rule packs, penalties, and season windows; stores in Supabase config tables.",
        player: "Hidden-rule sessions persist across days; streaks apply to participation/completion.",
    },
    {
        id: "hybrid",
        mode: "Event-based",
        admin: "Super-admin stitches mutators (cognitive weather, delayed feedback, genre inference) into events.",
        player: "Event outcomes and UH scores logged; no daily streak unless flagged.",
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

function WordleGame({
    target,
    badge,
    onComplete,
}: {
    target: string;
    badge: string;
    onComplete?: (score: number, label?: string) => void;
}) {
    const [guess, setGuess] = useState("");
    const [history, setHistory] = useState<GuessRecord[]>([]);
    const [message, setMessage] = useState<string | null>(null);
    const [reported, setReported] = useState(false);

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
            if (!reported && onComplete) {
                onComplete(100 - (nextHistory.length - 1) * 10, target);
                setReported(true);
            }
            return;
        }

        if (nextHistory.length >= MAX_ATTEMPTS) {
            setMessage(`Game Over. The word was ${target}.`);
            if (!reported && onComplete) {
                onComplete(10, target);
                setReported(true);
            }
            return;
        }

        setMessage(null);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.5em] text-[var(--text-secondary)]">5-letter Wordle</p>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-white/70">
                    {badge}
                </span>
            </div>

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

function PolygonleGame({
    target,
    badge,
    onComplete,
}: {
    target: string;
    badge: string;
    onComplete?: (score: number, label?: string) => void;
}) {
    const blueprint = useMemo(() => buildPolygonBlueprint(target), [target]);
    const [guess, setGuess] = useState("");
    const [history, setHistory] = useState<GuessRecord[]>([]);
    const [message, setMessage] = useState<string | null>(null);
    const [reported, setReported] = useState(false);

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
            if (!reported && onComplete) {
                onComplete(100 - (nextHistory.length - 1) * 10, target);
                setReported(true);
            }
            return;
        }

        if (nextHistory.length >= MAX_ATTEMPTS) {
            setMessage(`Game Over. The secret word was ${target}.`);
            if (!reported && onComplete) {
                onComplete(10, target);
                setReported(true);
            }
            return;
        }

        setMessage(null);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.5em] text-[var(--text-secondary)]">Polygonle schema</p>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-white/70">
                    {badge}
                </span>
            </div>

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
    const [selectedGameDate, setSelectedGameDate] = useState(todayKey);
    const [adminMode, setAdminMode] = useState(false);
    const [catalog, setCatalog] = useState<AdminGameEntry[]>([]);
    const [results, setResults] = useState<GameResult[]>([]);
    const polygonleTarget = useMemo(() => pickWordForDate(selectedGameDate, POLYGONLE_WORDS), [selectedGameDate]);
    const wordleTarget = useMemo(() => pickWordForDate(selectedGameDate, WORDLE_WORDS), [selectedGameDate]);
    const [activePrototype, setActivePrototype] = useState<PrototypeId>("polygonle");
    const [crosswordTopic, setCrosswordTopic] = useState("general knowledge");
    const [crosswordDifficulty, setCrosswordDifficulty] = useState("medium");
    const [selectedPlaceholder, setSelectedPlaceholder] = useState(gamePlaceholders[0].id);
    const [selectedInstanceIds, setSelectedInstanceIds] = useState<Record<GameType, string>>({
        wordle: "",
        polygonle: "",
        crossword: "",
        sudoku: "",
        mao: "",
        hybrid: "",
    });
    const [adminForm, setAdminForm] = useState<AdminGameEntry>({
        id: "",
        type: "wordle",
        date: todayKey,
        label: "",
        payload: "",
    });

    useEffect(() => {
        const hydrate = async () => {
            const remoteCatalog = await fetchCatalogApi(selectedGameDate);
            const remoteResults = await fetchResultsApi(selectedGameDate);
            if (remoteCatalog.length > 0) {
                setCatalog(remoteCatalog);
                saveCatalog(remoteCatalog);
            } else {
                setCatalog(loadCatalog());
            }
            if (remoteResults.length > 0) {
                setResults(remoteResults);
                saveResults(remoteResults);
            } else {
                setResults(loadResults());
            }
        };
        void hydrate();
    }, [selectedGameDate]);

    const recordResult = (type: GameType, score: number, label?: string) => {
        const entry: GameResult = {
            id: `${type}-${Date.now()}`,
            type,
            date: selectedGameDate,
            score,
            label,
        };
        setResults((prev) => {
            const next = [...prev, entry];
            saveResults(next);
            return next;
        });
        // Fire-and-forget to API; ignore errors to keep UX smooth
        void fetch("/api/game-results", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(entry),
        });
    };

    const addAdminEntry = () => {
        if (!adminForm.label.trim()) return;
        const entry: AdminGameEntry = {
            ...adminForm,
            id: `${adminForm.type}-${adminForm.date}-${Date.now()}`,
        };
        setCatalog((prev) => {
            const next = [...prev, entry];
            saveCatalog(next);
            return next;
        });
        void fetch("/api/games", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(entry),
        });
        setAdminForm((prev) => ({ ...prev, label: "", payload: "" }));
    };

    const todaysCatalog = useMemo(
        () => catalog.filter((item) => item.date === selectedGameDate),
        [catalog, selectedGameDate],
    );

    const buildBadge = (index: number, label?: string) => {
        if (label && label.trim().length > 0) return `${selectedGameDate} - ${label.trim()}`;
        return `${selectedGameDate} - #${index + 1}`;
    };

    const buildInstances = (type: GameType, fallbackTarget: string): GameInstance[] => {
        const matches = todaysCatalog.filter((item) => item.type === type);
        if (matches.length === 0) {
            return [
                {
                    id: `${type}-default-1`,
                    target: fallbackTarget,
                    label: `${todayKey} - #1`,
                    badge: `${todayKey} - #1`,
                },
            ];
        }
        return matches.map((item, idx) => {
            const target = item.payload?.trim() && item.payload.trim().length > 0 ? item.payload.trim() : fallbackTarget;
            const label = buildBadge(idx, item.label);
            return {
                id: item.id || `${type}-${idx + 1}`,
                target,
                label,
                badge: label,
            };
        });
    };

    const instanceMap = useMemo(
        () => ({
            polygonle: buildInstances("polygonle", polygonleTarget),
            wordle: buildInstances("wordle", wordleTarget),
            crossword: buildInstances("crossword", "crossword"),
            sudoku: buildInstances("sudoku", "sudoku"),
            mao: buildInstances("mao", "mao"),
            hybrid: buildInstances("hybrid", "hybrid"),
        }),
        [polygonleTarget, wordleTarget, todaysCatalog, selectedGameDate],
    );

    useEffect(() => {
        setSelectedInstanceIds((prev) => {
            const next = { ...prev };
            (Object.keys(instanceMap) as GameType[]).forEach((type) => {
                const list = instanceMap[type];
                if (!next[type] && list.length > 0) {
                    next[type] = list[0].id;
                }
            });
            return next;
        });
    }, [instanceMap]);

    const pickActiveInstance = (type: GameType): GameInstance => {
        const list = instanceMap[type];
        const selected = list.find((item) => item.id === selectedInstanceIds[type]);
        return selected || list[0];
    };

    const polygonleAdminInstance = pickActiveInstance("polygonle");
    const wordleAdminInstance = pickActiveInstance("wordle");
    const sudokuInstance = pickActiveInstance("sudoku");
    const maoInstance = pickActiveInstance("mao");
    const hybridInstance = pickActiveInstance("hybrid");
    const todaysResults = useMemo(
        () => results.filter((r) => r.date === selectedGameDate),
        [results, selectedGameDate],
    );
    const scoreByType = useMemo(() => {
        const grouped: Record<GameType, { scores: number[]; labels: string[] }> = {
            wordle: { scores: [], labels: [] },
            polygonle: { scores: [], labels: [] },
            crossword: { scores: [], labels: [] },
            sudoku: { scores: [], labels: [] },
            mao: { scores: [], labels: [] },
            hybrid: { scores: [], labels: [] },
        };
        todaysResults.forEach((r) => {
            grouped[r.type].scores.push(r.score);
            if (r.label) grouped[r.type].labels.push(r.label);
        });
        return grouped;
    }, [todaysResults]);

    const prototypeOptions = useMemo(
        () => [
            {
                id: "polygonle" as const,
                label: "Polygonle (Constraint Reveal)",
                description: "Geometric schema + Wordle feedback for repetition-spotting brains.",
                element: (
                    <PolygonleGame
                        target={polygonleAdminInstance.target}
                        badge={polygonleAdminInstance.badge}
                        onComplete={(score, label) =>
                            recordResult("polygonle", score, label || polygonleAdminInstance.label || polygonleAdminInstance.badge)
                        }
                    />
                ),
            },
            {
                id: "wordle" as const,
                label: "Wordle (Classic Feel)",
                description: "Simple five-letter daily with local streak memory.",
                element: (
                    <WordleGame
                        target={wordleAdminInstance.target}
                        badge={wordleAdminInstance.badge}
                        onComplete={(score, label) =>
                            recordResult("wordle", score, label || wordleAdminInstance.label || wordleAdminInstance.badge)
                        }
                    />
                ),
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
            {
                id: "sudoku" as const,
                label: "Sudoku (Mini)",
                description: "4x4 explain-your-move Sudoku to stay stable on mobile.",
                element: (
                    <SudokuMini
                        badge={sudokuInstance.badge}
                        onComplete={(score, label) =>
                            recordResult("sudoku", score, label || sudokuInstance.label || sudokuInstance.badge)
                        }
                    />
                ),
            },
            {
                id: "mao" as const,
                label: "Mao (Hidden Rule)",
                description: "Stub for hidden-rule enforcement + guess flow.",
                element: (
                    <MaoRuleGuess
                        badge={maoInstance.badge}
                        onComplete={(score, label) =>
                            recordResult("mao", score, label || maoInstance.label || maoInstance.badge)
                        }
                    />
                ),
            },
            {
                id: "hybrid" as const,
                label: "Hybrid Weather",
                description: "Cognitive weather mutator sandbox (hold/probe/commit).",
                element: (
                    <HybridWeatherGame
                        badge={hybridInstance.badge}
                        onComplete={(score, label) =>
                            recordResult("hybrid", score, label || hybridInstance.label || hybridInstance.badge)
                        }
                    />
                ),
            },
        ],
        [
            crosswordDifficulty,
            crosswordTopic,
            polygonleAdminInstance,
            wordleAdminInstance,
            sudokuInstance,
            maoInstance,
            hybridInstance,
        ],
    );

    const activePrototypeConfig =
        prototypeOptions.find((prototype) => prototype.id === activePrototype) ?? prototypeOptions[0];
    const activePlaceholderConfig =
        gamePlaceholders.find((game) => game.id === selectedPlaceholder) ?? gamePlaceholders[0];

    return (
        <>
            <div className="fixed inset-0 bg-black -z-10" />
            <div className="contents">
                <div className="contents">
                    <header className="snap-start scroll-m-12 max-w-6xl mx-auto w-full px-6 py-24 space-y-6 text-center text-white">
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

                    <section className="snap-start scroll-m-6 max-w-6xl mx-auto w-full mb-24 rounded-[3rem] border border-white/10 bg-gradient-to-br from-white/5 via-white/0 to-white/10 p-10 space-y-8 backdrop-blur-2xl shadow-2xl">
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
                                        className={`rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.3em] border transition ${activePrototype === prototype.id
                                                ? "border-white bg-white text-black shadow-lg"
                                                : "border-white/10 bg-white/5 text-white/70 hover:border-white/40"
                                            }`}
                                    >
                                        {prototype.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <p className="text-sm text-white/70 leading-relaxed max-w-3xl">
                                {activePrototypeConfig.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-3">
                                <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-white/50">
                                    Game date
                                    <input
                                        type="date"
                                        value={selectedGameDate}
                                        onChange={(event) => setSelectedGameDate(event.target.value)}
                                        className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-semibold text-white focus:border-white/40"
                                    />
                                </label>
                                <div className="flex items-center gap-2">
                                    <p className="text-[10px] uppercase tracking-[0.3em] text-white/50">Instance</p>
                                    <select
                                        value={selectedInstanceIds[activePrototype]}
                                        onChange={(event) =>
                                            setSelectedInstanceIds((prev) => ({
                                                ...prev,
                                                [activePrototype]: event.target.value,
                                            }))
                                        }
                                        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-black uppercase tracking-[0.3em] text-white/80 focus:border-white/40 outline-none"
                                    >
                                        {instanceMap[activePrototype].map((instance) => (
                                            <option key={instance.id} value={instance.id}>
                                                {instance.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-8 shadow-inner">
                            {activePrototypeConfig.element}
                        </div>
                    </section>

                    <section className="snap-start scroll-m-6 max-w-6xl mx-auto w-full mb-24 rounded-[3rem] border border-white/10 bg-gradient-to-br from-white/10 via-white/0 to-white/5 p-10 space-y-8 backdrop-blur-2xl shadow-2xl">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.6em] text-white/40">
                                    Today&apos;s scores
                                </p>
                                <h2 className="text-3xl sm:text-4xl font-black tracking-tighter">Daily performance</h2>
                                <p className="text-white/70 mt-2">
                                    Best or averaged per game type; use for streaks and leaderboards.
                                </p>
                            </div>
                            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/70">
                                {todaysResults.length} results
                            </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {(Object.keys(scoreByType) as GameType[]).map((type) => {
                                const entry = scoreByType[type];
                                const avg =
                                    entry.scores.length === 0
                                        ? 0
                                        : Math.round(entry.scores.reduce((a, b) => a + b, 0) / entry.scores.length);
                                const best = entry.scores.length === 0 ? 0 : Math.max(...entry.scores);
                                return (
                                    <div
                                        key={type}
                                        className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 space-y-2 shadow-inner"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <h3 className="text-xl font-black tracking-tight uppercase">{type}</h3>
                                            <span className="text-xs text-white/60">
                                                {entry.scores.length} game{entry.scores.length === 1 ? "" : "s"}
                                            </span>
                                        </div>
                                        <p className="text-sm text-white/80">Avg: {avg}</p>
                                        <p className="text-sm text-white/80">Best: {best}</p>
                                        {entry.labels.length > 0 && (
                                            <p className="text-[11px] text-white/60">
                                                Latest: {entry.labels[entry.labels.length - 1]}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <section className="snap-start scroll-m-6 max-w-6xl mx-auto w-full mb-24 rounded-[3rem] border border-white/10 bg-gradient-to-br from-white/10 via-white/0 to-white/5 p-10 space-y-8 backdrop-blur-2xl shadow-2xl">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.6em] text-white/50">
                                    Admin catalog (local demo)
                                </p>
                                <h2 className="text-3xl sm:text-4xl font-black tracking-tighter">Seed daily games</h2>
                                <p className="text-white/70 mt-2">
                                    Super-admin can create multiple games per type per day. Stored locally here; wire to Supabase
                                    for production.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setAdminMode((v) => !v)}
                                className={`rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.3em] border transition ${adminMode ? "border-white bg-white text-black" : "border-white/10 bg-white/5 text-white/70"
                                    }`}
                            >
                                {adminMode ? "Admin On" : "Admin Off"}
                            </button>
                        </div>
                        {adminMode && (
                            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 space-y-4 shadow-inner">
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <label className="space-y-2 text-xs font-bold uppercase tracking-[0.3em] text-white/60">
                                        Date
                                        <input
                                            type="date"
                                            value={adminForm.date}
                                            onChange={(e) => setAdminForm((prev) => ({ ...prev, date: e.target.value }))}
                                            className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
                                        />
                                    </label>
                                    <label className="space-y-2 text-xs font-bold uppercase tracking-[0.3em] text-white/60">
                                        Game type
                                        <select
                                            value={adminForm.type}
                                            onChange={(e) =>
                                                setAdminForm((prev) => ({ ...prev, type: e.target.value as GameType }))
                                            }
                                            className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
                                        >
                                            <option value="wordle">Wordle</option>
                                            <option value="polygonle">Polygonle</option>
                                            <option value="crossword">Crossword</option>
                                            <option value="sudoku">Sudoku</option>
                                            <option value="mao">Mao</option>
                                            <option value="hybrid">Hybrid</option>
                                        </select>
                                    </label>
                                    <label className="space-y-2 text-xs font-bold uppercase tracking-[0.3em] text-white/60">
                                        Label
                                        <input
                                            value={adminForm.label}
                                            onChange={(e) => setAdminForm((prev) => ({ ...prev, label: e.target.value }))}
                                            placeholder="Daily #1"
                                            className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40"
                                        />
                                    </label>
                                </div>
                                <label className="block space-y-2 text-xs font-bold uppercase tracking-[0.3em] text-white/60">
                                    Payload (target word, seed, or notes)
                                    <input
                                        value={adminForm.payload}
                                        onChange={(e) => setAdminForm((prev) => ({ ...prev, payload: e.target.value }))}
                                        placeholder="e.g., CRANE / HEXAGON / grid-id"
                                        className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40"
                                    />
                                </label>
                                <button
                                    type="button"
                                    onClick={addAdminEntry}
                                    className="rounded-full border border-white/10 bg-white text-black px-5 py-2 text-[11px] font-black uppercase tracking-[0.3em] shadow"
                                >
                                    Add game
                                </button>
                                <div className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-2 text-sm text-white/75">
                                    <p className="text-[10px] uppercase tracking-[0.3em] text-white/50">
                                        Today&apos;s catalog ({todayKey})
                                    </p>
                                    {todaysCatalog.length === 0 ? (
                                        <p>No admin-seeded games. Using defaults.</p>
                                    ) : (
                                        todaysCatalog.map((item) => (
                                            <div key={item.id} className="flex items-center justify-between gap-3">
                                                <span className="font-semibold uppercase tracking-[0.2em]">{item.type}</span>
                                                <span className="text-white/70">{item.label || "(untitled)"}</span>
                                                <span className="text-white/50 text-xs">{item.payload || "no payload"}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </section>

                    <section className="snap-start scroll-m-6 max-w-6xl mx-auto w-full mb-24 rounded-[3rem] border border-white/10 bg-gradient-to-br from-white/10 via-white/0 to-white/5 p-10 space-y-8 backdrop-blur-2xl shadow-2xl">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.6em] text-white/50">
                                    State, streaks, and admin controls
                                </p>
                                <h2 className="text-3xl sm:text-4xl font-black tracking-tighter">Framework for all games</h2>
                                <p className="text-white/70 mt-2">
                                    Daily stateful drops + infinite practice; super-admin only can seed, publish, and archive. Streaks,
                                    UH scores, shareability, and leaderboards flow from the same Supabase Postgres schema.
                                </p>
                            </div>
                            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/70">
                                Governance-ready
                            </div>
                        </div>
                        <div className="grid gap-4 lg:grid-cols-2">
                            {gameGovernance.map((game) => (
                                <div
                                    key={game.id}
                                    className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 space-y-3 shadow-inner"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <h3 className="text-xl font-black tracking-tight">{game.id.toUpperCase()}</h3>
                                        <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-white/80">
                                            {game.mode}
                                        </span>
                                    </div>
                                    <p className="text-sm text-white/80">
                                        <strong className="font-semibold text-white">Admin:</strong> {game.admin}
                                    </p>
                                    <p className="text-sm text-white/80">
                                        <strong className="font-semibold text-white">Player:</strong> {game.player}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <div className="rounded-[1.5rem] border border-dashed border-white/20 bg-black/30 p-5 text-sm text-white/75 space-y-2">
                            <p className="font-semibold">Data spine</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Supabase Postgres tables: <code>games</code>, <code>game_instances</code>, <code>game_results</code>, <code>leaderboards</code>.</li>
                                <li>Access control: only <code>role = super_admin</code> can create/publish daily targets.</li>
                                <li>Stateful streaks: per-user per-game, day-over-day captured in <code>game_results</code>.</li>
                                <li>Stateless practice: infinite runs recorded as <code>practice</code> with no streak impact.</li>
                                <li>Shareability: signed share links per result; opt-in leaderboards per game.</li>
                            </ul>
                        </div>
                    </section>

                    <section className="snap-start scroll-m-6 max-w-6xl mx-auto w-full mb-24 rounded-[3rem] border border-white/10 bg-gradient-to-br from-white/10 via-white/0 to-white/5 p-10 space-y-8 backdrop-blur-2xl shadow-2xl">
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

                    <section className="snap-start scroll-m-6 max-w-6xl mx-auto w-full mb-32 rounded-[3rem] border border-white/10 bg-gradient-to-br from-white/10 via-white/0 to-white/5 p-10 space-y-6 backdrop-blur-2xl shadow-2xl">
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
        </>
    );
}
