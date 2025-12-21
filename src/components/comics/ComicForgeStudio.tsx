 "use client";

import { useEffect, useMemo, useRef, useState } from "react";

const PALETTES = {
    cinematic: { paper: "#f7f4ee", ink: "#0b0b0b", skySunny: "#9cc9f3", skyDusk: "#6f5aa6", skyNight: "#0b1726", snow: "#ffffff", tree: "#2d5b3b" },
    tinkle: { paper: "#fffbe6", ink: "#111111", skySunny: "#a7d8ff", skyDusk: "#ffd1a3", skyNight: "#22283a", snow: "#ffffff", tree: "#2c7a2c" },
    noir: { paper: "#efefef", ink: "#000000", skySunny: "#a0a0a0", skyDusk: "#606060", skyNight: "#111111", snow: "#ffffff", tree: "#1a1a1a" },
};

const HOUSE = {
    stark: { primary: "#9aa3a6", accent: "#ffffff" },
    lannister: { primary: "#8b0000", accent: "#ffd700" },
    targaryen: { primary: "#0b0b0b", accent: "#9c0000" },
    nightsWatch: { primary: "#0a0a0a", accent: "#444444" },
    generic: { primary: "#446688", accent: "#f1c27d" },
};

const SHOT = {
    establishing: { zoom: 0.6, bias: { x: 0.5, y: 0.45 } },
    wide: { zoom: 0.9, bias: { x: 0.5, y: 0.5 } },
    medium: { zoom: 1.0, bias: { x: 0.5, y: 0.45 } },
    closeup: { zoom: 1.6, bias: { x: 0.5, y: 0.4 } },
    insert: { zoom: 2.4, bias: { x: 0.5, y: 0.5 } },
};

const POSES = {
    idle: { arms: "down", torso: "straight", legs: "standing" },
    point: { arms: "oneUp", torso: "leanForward", legs: "standing" },
    walk: { arms: "swing", torso: "slight", legs: "step" },
    crouch: { arms: "guard", torso: "low", legs: "crouch" },
    swordReady: { arms: "twoUp", torso: "tense", legs: "wide" },
    lookout: { arms: "shieldEyes", torso: "straight", legs: "standing" },
};

const EXPRESSIONS = {
    neutral: { happy: 0, anger: 0, sad: 0, focused: 0 },
    happy: { happy: 1, anger: 0, sad: 0, focused: 0 },
    angry: { happy: 0, anger: 1, sad: 0, focused: 0 },
    sad: { happy: 0, anger: 0, sad: 1, focused: 0 },
    focused: { happy: 0, anger: 0, sad: 0, focused: 1 },
};

const STYLES = {
    default: { inkThickness: 2, halftone: false, grain: 0.06, font: "System", balloon: "rounded", paperTexture: false },
    halftone: { inkThickness: 2.2, halftone: true, grain: 0.12, font: "System", balloon: "rounded", paperTexture: true },
    thinInk: { inkThickness: 1.2, halftone: false, grain: 0.03, font: "System", balloon: "bubble", paperTexture: false },
};

const WEATHER = ["clear", "snow", "rain", "fog"];
const LOCATIONS = ["castle", "courtyard", "forest", "wall", "village", "seaside"];

const LAYOUTS = {
    "1x1": { cols: 1, rows: 1 },
    "1x2": { cols: 1, rows: 2 },
    "2x2": { cols: 2, rows: 2 },
    "3x2": { cols: 3, rows: 2 },
    "4x2": { cols: 4, rows: 2 },
    "3x3": { cols: 3, rows: 3 },
    "4x3": { cols: 4, rows: 3 },
};

const SFX = {
    sword: ["CLANG", "SHAAK", "SWISH"],
    foot: ["THUD", "STOMP"],
    wind: ["WHOOSH"],
    hit: ["WHAM", "SMACK", "CRACK"],
};

let panelCounter = 0;

type PanelEnv = {
    time: "dawn" | "dusk" | "noon" | "night";
    weather: (typeof WEATHER)[number];
    location: (typeof LOCATIONS)[number];
    shot: keyof typeof SHOT;
};

type ComicCharacter = {
    id: string;
    name: string;
    house: keyof typeof HOUSE;
    pose: keyof typeof POSES;
    expression: keyof typeof EXPRESSIONS;
    facing: "left" | "right";
    scale: number;
};

type ComicPanel = {
    id: string;
    caption: string;
    env: PanelEnv;
    characters: ComicCharacter[];
    dialogue: string[];
    sfx?: string;
};

function createSeededRand(seed: number) {
    let s = Number.isFinite(seed) ? Math.abs(Math.floor(seed)) % 2147483647 : 1;
    if (s === 0) s = 1;
    return function (min = 0, max = 1) {
        s = (Math.imul(48271, s) % 2147483647);
        const r = (s & 0x7fffffff) / 2147483647;
        return min + r * (max - min);
    };
}

function createCharacter(spec?: Partial<ComicCharacter>): ComicCharacter {
    const base: ComicCharacter = {
        id: `char-${Math.random().toString(36).slice(2, 8)}`,
        name: "Anon",
        house: "generic",
        pose: "idle",
        expression: "neutral",
        facing: "right",
        scale: 1,
    };
    return { ...base, ...spec };
}

function createPanel(spec?: Partial<ComicPanel>): ComicPanel {
    panelCounter += 1;
    const base: ComicPanel = {
        id: `panel-${panelCounter}`,
        caption: "",
        env: { time: "dusk", weather: "snow", location: "forest", shot: "wide" },
        characters: [createCharacter()],
        dialogue: [],
    };
    return { ...base, ...spec };
}

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

function drawPanel(
    ctx: CanvasRenderingContext2D,
    rect: { x: number; y: number; w: number; h: number },
    panel: ComicPanel,
    palette: (typeof PALETTES)[keyof typeof PALETTES],
    style: (typeof STYLES)[keyof typeof STYLES],
    rand: () => number,
) {
    // paint sky
    let sky = palette.skySunny;
    if (panel.env.time === "dusk") sky = palette.skyDusk;
    if (panel.env.time === "night") sky = palette.skyNight;
    ctx.fillStyle = sky;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

    // ground
    ctx.fillStyle = "#6d5136";
    ctx.fillRect(rect.x, rect.y + rect.h * 0.6, rect.w, rect.h * 0.4);

    const shot = SHOT[panel.env.shot] ?? SHOT.wide;
    const bandW = rect.w * clamp(1 / shot.zoom, 0.35, 1.4);
    const centerX = rect.x + rect.w * shot.bias.x;
    const baseY = rect.y + rect.h * 0.65;

    panel.characters.forEach((character, index) => {
        const spacing = bandW / Math.max(panel.characters.length, 1);
        const cx = centerX + (index - (panel.characters.length - 1) / 2) * spacing * 0.9 + (rand() * 16 - 8);
        const cy = baseY + (rand() * 18 - 8);
        const size = clamp(60 * shot.zoom * character.scale, 24, 120);
        drawCharacter(ctx, cx, cy, size, character);
    });

    if (panel.dialogue.length) {
        const bubbleW = rect.w * 0.8;
        const bubbleH = 68;
        const bx = rect.x + (rect.w - bubbleW) / 2;
        const by = rect.y + rect.h - bubbleH - 8;
        drawSpeechBubble(ctx, bx, by, bubbleW, bubbleH, panel.dialogue.join("\n"), palette.ink);
    }

    if (panel.sfx) {
        ctx.fillStyle = palette.ink;
        ctx.font = "bold 24px sans-serif";
        ctx.fillText(panel.sfx, rect.x + rect.w * 0.55, rect.y + rect.h * 0.2);
    }

    ctx.strokeStyle = palette.ink;
    ctx.lineWidth = style.inkThickness;
    ctx.strokeRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);
}

function drawCharacter(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, character: ComicCharacter) {
    ctx.fillStyle = HOUSE[character.house]?.primary ?? "#446688";
    ctx.fillRect(x - size * 0.25, y - size * 0.5, size * 0.5, size * 0.7);
    ctx.fillStyle = character.scale > 1 ? "#f9c9b6" : "#f0d5b3";
    ctx.beginPath();
    ctx.ellipse(x, y - size * 0.6, size * 0.2, size * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = paletteInk(character);
    ctx.beginPath();
    ctx.arc(x - size * 0.08, y - size * 0.6, size * 0.04, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + size * 0.08, y - size * 0.6, size * 0.04, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x - size * 0.05, y - size * 0.5, size * 0.1, size * 0.03);
}

function paletteInk(character: ComicCharacter) {
    if (character.expression === "angry") return "#7d0f0f";
    if (character.expression === "happy") return "#0a0a0a";
    return "#0f0f0f";
}

function drawSpeechBubble(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, text: string, ink: string) {
    ctx.fillStyle = "#fffdf0";
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x + 12, y);
    ctx.lineTo(x + w - 12, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + 10);
    ctx.lineTo(x + w, y + h - 12);
    ctx.quadraticCurveTo(x + w, y + h, x + w - 12, y + h);
    ctx.lineTo(x + w / 2 + 12, y + h);
    ctx.lineTo(x + w / 2, y + h + 16);
    ctx.lineTo(x + w / 2 - 12, y + h);
    ctx.lineTo(x + 12, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - 12);
    ctx.lineTo(x, y + 10);
    ctx.quadraticCurveTo(x, y, x + 12, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = ink;
    ctx.font = "12px sans-serif";
    const lines = text.split("\n");
    lines.forEach((line, index) => {
        ctx.fillText(line, x + 12, y + 22 + index * 16);
    });
}

type ModalContent = "palette" | "details" | null;

export default function ComicForgeStudio() {
    const [title, setTitle] = useState("Untitled Comic");
    const [seedInput, setSeedInput] = useState(() => String(Math.floor(Math.random() * 1e9)));
    const [layoutKey, setLayoutKey] = useState<keyof typeof LAYOUTS>("3x3");
    const [paletteKey, setPaletteKey] = useState<keyof typeof PALETTES>("cinematic");
    const [styleKey, setStyleKey] = useState<keyof typeof STYLES>("default");
    const [panels, setPanels] = useState<ComicPanel[]>(() => {
        const spec = LAYOUTS["3x3"];
        return Array.from({ length: spec.cols * spec.rows }, () => createPanel());
    });
    const [selectedPanelId, setSelectedPanelId] = useState<string | null>(panels[0]?.id ?? null);
    const [modalContent, setModalContent] = useState<ModalContent>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const layoutSpec = LAYOUTS[layoutKey];
    const numericSeed = useMemo(() => {
        const parsed = Number(seedInput);
        return Number.isFinite(parsed) ? Math.abs(Math.trunc(parsed)) : 371_293;
    }, [seedInput]);

    const syncPanelCount = (targetCount: number) => {
        setPanels((current) => {
            if (current.length === targetCount) return current;
            const next = [...current];
            while (next.length < targetCount) {
                next.push(createPanel());
            }
            return next.slice(0, targetCount);
        });
    };

    const handleLayoutChange = (newKey: keyof typeof LAYOUTS) => {
        setLayoutKey(newKey);
        const spec = LAYOUTS[newKey];
        syncPanelCount(spec.cols * spec.rows);
    };

    const activePanelId = panels.some((panel) => panel.id === selectedPanelId)
        ? selectedPanelId
        : panels[0]?.id ?? null;
    const selectedPanel = useMemo(
        () => panels.find((panel) => panel.id === activePanelId) ?? null,
        [panels, activePanelId],
    );
    const selectedPanelIndex = useMemo(
        () => Math.max(0, panels.findIndex((panel) => panel.id === activePanelId)),
        [panels, activePanelId],
    );

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const palette = PALETTES[paletteKey];
        const style = STYLES[styleKey];
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = palette.paper;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = palette.ink;
        ctx.font = "bold 28px sans-serif";
        ctx.fillText(title, 24, 40);

        const panelWidth = Math.floor((canvas.width - (layoutSpec.cols + 1) * 16) / layoutSpec.cols);
        const panelHeight = Math.floor((canvas.height - 140 - (layoutSpec.rows + 1) * 16) / layoutSpec.rows);

        panels.forEach((panel, index) => {
            const row = Math.floor(index / layoutSpec.cols);
            const col = index % layoutSpec.cols;
            const rect = {
                x: 16 + col * (panelWidth + 16),
                y: 80 + row * (panelHeight + 16),
                w: panelWidth,
                h: panelHeight,
            };
            const panelRand = createSeededRand(numericSeed + index * 73);
            drawPanel(ctx, rect, panel, palette, style, panelRand);
        });
    }, [panels, paletteKey, styleKey, title, numericSeed, layoutSpec]);

    type PanelChange = Partial<Omit<ComicPanel, "env">> & { env?: Partial<PanelEnv> };
    const handlePanelChange = (panelId: string, changes: PanelChange) => {
        setPanels((current) =>
            current.map((panel) =>
                panel.id === panelId
                    ? { ...panel, ...changes, env: { ...panel.env, ...(changes.env ?? {}) } }
                    : panel,
            ),
        );
    };

    const handleCharacterChange = (panelId: string, charId: string, changes: Partial<ComicCharacter>) => {
        setPanels((current) =>
            current.map((panel) => {
                if (panel.id !== panelId) return panel;
                return {
                    ...panel,
                    characters: panel.characters.map((character) =>
                        character.id === charId ? { ...character, ...changes } : character,
                    ),
                };
            }),
        );
    };

    const handleAddCharacter = (panelId: string) => {
        setPanels((current) =>
            current.map((panel) =>
                panel.id === panelId
                    ? { ...panel, characters: [...panel.characters, createCharacter()] }
                    : panel,
            ),
        );
    };

    const handleRemoveCharacter = (panelId: string, charId: string) => {
        setPanels((current) =>
            current.map((panel) =>
                panel.id === panelId
                    ? { ...panel, characters: panel.characters.filter((character) => character.id !== charId) }
                    : panel,
            ),
        );
    };

    const handleExport = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dataUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `${title || "comic-forge"}.png`;
        link.href = dataUrl;
        link.click();
    };

    const handleAddPanel = () => {
        setPanels((current) => [...current, createPanel()].slice(0, layoutSpec.cols * layoutSpec.rows));
    };

    const handleModalClose = () => setModalContent(null);

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
                <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-xl">
                    <div className="flex flex-wrap items-center gap-4">
                        <input
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            className="flex-1 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-lg font-bold text-white focus:border-cyan-400 outline-none"
                            placeholder="Story title"
                        />
                        <button
                            type="button"
                            onClick={() => setSeedInput(String(Math.floor(Math.random() * 1e9)))}
                            className="rounded-full border border-cyan-500/60 px-4 py-2 text-xs uppercase tracking-[0.3em] text-cyan-200"
                        >
                            Shuffle seed
                        </button>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                        <label className="flex items-center gap-2">
                            <span>Seed</span>
                            <input
                                value={seedInput}
                                onChange={(event) => setSeedInput(event.target.value)}
                                className="w-32 rounded-2xl border border-slate-800 bg-slate-950/60 px-3 py-1 text-xs font-semibold text-white outline-none"
                            />
                        </label>
                        <label className="flex items-center gap-2">
                            <span>Layout</span>
                            <select
                                value={layoutKey}
                                onChange={(event) =>
                                    handleLayoutChange(event.target.value as keyof typeof LAYOUTS)
                                }
                                className="rounded-2xl border border-slate-800 bg-slate-950/60 px-3 py-1 text-xs font-semibold text-white outline-none"
                            >
                                {Object.keys(LAYOUTS).map((key) => (
                                    <option key={key} value={key}>
                                        {key}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="flex items-center gap-2">
                            <span>Palette</span>
                            <select
                                value={paletteKey}
                                onChange={(event) => setPaletteKey(event.target.value as keyof typeof PALETTES)}
                                className="rounded-2xl border border-slate-800 bg-slate-950/60 px-3 py-1 text-xs font-semibold text-white outline-none"
                            >
                                {Object.keys(PALETTES).map((key) => (
                                    <option key={key} value={key}>
                                        {key}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="flex items-center gap-2">
                            <span>Style</span>
                            <select
                                value={styleKey}
                                onChange={(event) => setStyleKey(event.target.value as keyof typeof STYLES)}
                                className="rounded-2xl border border-slate-800 bg-slate-950/60 px-3 py-1 text-xs font-semibold text-white outline-none"
                            >
                                {Object.keys(STYLES).map((key) => (
                                    <option key={key} value={key}>
                                        {key}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                    <div className="mt-4">
                        <canvas ref={canvasRef} width={960} height={640} className="w-full rounded-3xl border border-white/10 bg-white/70 shadow-2xl" />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={() => setModalContent("details")}
                            className="rounded-2xl border border-white/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em]"
                        >
                            View legend
                        </button>
                        <button
                            type="button"
                            onClick={() => setModalContent("palette")}
                            className="rounded-2xl border border-white/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em]"
                        >
                            Cinematic glossary
                        </button>
                        <button
                            type="button"
                            onClick={handleExport}
                            className="rounded-2xl bg-cyan-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-950"
                        >
                            Export PNG
                        </button>
                    </div>
                </div>

                <div className="rounded-3xl border border-white/5 bg-slate-950/80 p-4 shadow-xl">
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Active panel</p>
                    {selectedPanel ? (
                        <div className="mt-3 space-y-3 text-sm text-slate-100">
                            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3">
                                <label className="text-[10px] uppercase tracking-[0.4em] text-slate-400">Caption</label>
                                <input
                                    value={selectedPanel.caption}
                                    onChange={(event) =>
                                        handlePanelChange(selectedPanel.id, { caption: event.target.value })
                                    }
                                    className="mt-1 w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-white outline-none"
                                    placeholder="Add a beat description"
                                />
                            </div>
                            <div className="grid gap-2 text-xs text-slate-300">
                                <label className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-900/60 px-3 py-2">
                                    <span>Time</span>
                                    <select
                                        value={selectedPanel.env.time}
                                        onChange={(event) =>
                                            handlePanelChange(selectedPanel.id, { env: { time: event.target.value as PanelEnv["time"] } })
                                        }
                                        className="text-xs bg-transparent outline-none"
                                    >
                                        {["dawn", "dusk", "noon", "night"].map((time) => (
                                            <option key={time} value={time}>
                                                {time}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-900/60 px-3 py-2">
                                    <span>Weather</span>
                                    <select
                                        value={selectedPanel.env.weather}
                                        onChange={(event) =>
                                            handlePanelChange(selectedPanel.id, { env: { weather: event.target.value as PanelEnv["weather"] } })
                                        }
                                        className="text-xs bg-transparent outline-none"
                                    >
                                        {WEATHER.map((option) => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-900/60 px-3 py-2">
                                    <span>Location</span>
                                    <select
                                        value={selectedPanel.env.location}
                                        onChange={(event) =>
                                            handlePanelChange(selectedPanel.id, { env: { location: event.target.value as PanelEnv["location"] } })
                                        }
                                        className="text-xs bg-transparent outline-none"
                                    >
                                        {LOCATIONS.map((option) => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-900/60 px-3 py-2">
                                    <span>Shot</span>
                                    <select
                                        value={selectedPanel.env.shot}
                                        onChange={(event) =>
                                            handlePanelChange(selectedPanel.id, { env: { shot: event.target.value as PanelEnv["shot"] } })
                                        }
                                        className="text-xs bg-transparent outline-none"
                                    >
                                        {Object.keys(SHOT).map((shot) => (
                                            <option key={shot} value={shot}>
                                                {shot}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase tracking-[0.4em] text-slate-400">
                                    Dialogue
                                </label>
                                <textarea
                                    value={selectedPanel.dialogue.join("\n")}
                                    onChange={(event) =>
                                        handlePanelChange(selectedPanel.id, { dialogue: event.target.value.split("\n").filter(Boolean) })
                                    }
                                    className="mt-1 w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-white outline-none"
                                    rows={3}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase tracking-[0.4em] text-slate-400">
                                    SFX
                                </label>
                                <div className="mt-1 flex flex-wrap gap-2">
                                        {Object.keys(SFX).map((category) => (
                                            <button
                                                key={category}
                                                type="button"
                                                onClick={() =>
                                                    handlePanelChange(selectedPanel.id, {
                                                        sfx: pickSfx(
                                                            category as keyof typeof SFX,
                                                            numericSeed + selectedPanelIndex * 17,
                                                        ),
                                                    })
                                                }
                                                className="rounded-full border border-white/20 px-3 py-1 text-[11px] uppercase tracking-[0.2em]"
                                            >
                                                {category}
                                            </button>
                                        ))}
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.4em] text-slate-400">
                                    <span>Characters</span>
                                    <button
                                        type="button"
                                        onClick={() => handleAddCharacter(selectedPanel.id)}
                                        className="text-cyan-300 underline-offset-4 hover:underline"
                                    >
                                        + Add
                                    </button>
                                </div>
                                <div className="mt-2 space-y-2">
                                    {selectedPanel.characters.map((character) => (
                                        <div
                                            key={character.id}
                                            className="rounded-2xl border border-white/5 bg-slate-900/60 p-3 text-xs text-slate-100"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <input
                                                    value={character.name}
                                                    onChange={(event) =>
                                                        handleCharacterChange(selectedPanel.id, character.id, {
                                                            name: event.target.value,
                                                        })
                                                    }
                                                    className="flex-1 rounded-full border border-slate-800 bg-slate-950/70 px-2 py-1 text-xs outline-none"
                                                    placeholder="Name"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveCharacter(selectedPanel.id, character.id)}
                                                    className="text-[10px] uppercase tracking-[0.2em] text-rose-400"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                            <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                                <label className="flex items-center justify-between text-[10px]">
                                                    Pose
                                                    <select
                                                        value={character.pose}
                                                        onChange={(event) =>
                                                            handleCharacterChange(selectedPanel.id, character.id, {
                                                                pose: event.target.value as keyof typeof POSES,
                                                            })
                                                        }
                                                        className="text-[10px] bg-transparent outline-none"
                                                    >
                                                        {Object.keys(POSES).map((pose) => (
                                                            <option key={pose} value={pose}>
                                                                {pose}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </label>
                                                <label className="flex items-center justify-between text-[10px]">
                                                    Expression
                                                    <select
                                                        value={character.expression}
                                                        onChange={(event) =>
                                                            handleCharacterChange(selectedPanel.id, character.id, {
                                                                expression: event.target.value as keyof typeof EXPRESSIONS,
                                                            })
                                                        }
                                                        className="text-[10px] bg-transparent outline-none"
                                                    >
                                                        {Object.keys(EXPRESSIONS).map((expression) => (
                                                            <option key={expression} value={expression}>
                                                                {expression}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </label>
                                            </div>
                                            <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                                <label className="flex items-center justify-between text-[10px]">
                                                    House
                                                    <select
                                                        value={character.house}
                                                        onChange={(event) =>
                                                            handleCharacterChange(selectedPanel.id, character.id, {
                                                                house: event.target.value as keyof typeof HOUSE,
                                                            })
                                                        }
                                                        className="text-[10px] bg-transparent outline-none"
                                                    >
                                                        {Object.keys(HOUSE).map((house) => (
                                                            <option key={house} value={house}>
                                                                {house}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </label>
                                                <label className="flex items-center justify-between text-[10px]">
                                                    Scale
                                                    <input
                                                        type="number"
                                                        step={0.1}
                                                        min={0.6}
                                                        max={2.2}
                                                        value={character.scale}
                                                        onChange={(event) =>
                                                            handleCharacterChange(selectedPanel.id, character.id, {
                                                                scale: clamp(Number(event.target.value) || 1, 0.6, 2.2),
                                                            })
                                                        }
                                                        className="w-20 rounded-full border border-slate-800 bg-slate-950/70 px-2 py-1 text-xs outline-none"
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Select a panel to edit</p>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em]">
                <span className="text-slate-500">Panels</span>
                <button
                    type="button"
                    onClick={handleAddPanel}
                    className="rounded-full border border-white/20 px-4 py-1"
                >
                    Add panel
                </button>
                <div className="flex flex-wrap gap-2">
                    {panels.map((panel, index) => (
                        <button
                            key={panel.id}
                            onClick={() => setSelectedPanelId(panel.id)}
                            className={`rounded-full px-3 py-1 text-[11px] ${
                                panel.id === selectedPanelId
                                    ? "bg-cyan-500 text-slate-950"
                                    : "border border-white/10 text-slate-200"
                            }`}
                        >
                            Panel {index + 1}
                        </button>
                    ))}
                </div>
            </div>

            {modalContent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8">
                    <div className="w-full max-w-2xl rounded-3xl border border-white/20 bg-slate-950/95 p-6 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
                                {modalContent === "palette" ? "Cinematic Glossary" : "Legend"}
                            </p>
                            <button
                                type="button"
                                onClick={handleModalClose}
                                className="text-xs uppercase tracking-[0.3em] text-cyan-300"
                            >
                                Close
                            </button>
                        </div>
                        <div className="mt-4 space-y-3 text-sm text-slate-100">
                            {modalContent === "palette" ? (
                                <>
                                    <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Shots</p>
                                    <div className="grid gap-2 sm:grid-cols-3">
                                        {Object.entries(SHOT).map(([shot, details]) => (
                                            <div key={shot} className="rounded-2xl border border-white/10 p-3">
                                                <p className="text-sm font-semibold">{shot}</p>
                                                <p className="text-xs text-slate-400">Zoom {details.zoom}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Expressions</p>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.keys(EXPRESSIONS).map((expression) => (
                                            <span key={expression} className="rounded-full border border-white/10 px-3 py-1 text-[11px]">
                                                {expression}
                                            </span>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Panel legend</p>
                                    <ul className="list-inside list-disc space-y-1 text-xs text-slate-300">
                                        <li>Palette colors come from the selected mood.</li>
                                        <li>Weather toggles snow, rain, and fog overlays.</li>
                                        <li>Shots bias characters vertically and decide how much of the frame is visible.</li>
                                        <li>Dialogue + SFX stack near the bottom of each panel.</li>
                                    </ul>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function pickSfx(category: keyof typeof SFX, seed: number) {
    const rand = createSeededRand(seed);
    const list = SFX[category];
    return list[Math.floor(rand() * list.length)];
}
