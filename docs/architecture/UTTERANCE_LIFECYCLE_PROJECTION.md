# Utterance Lifecycle Projection (Canon-Preserving)

Source: CanonHolder → Canon_v1.CRUX, UTM_LC_v1  
Purpose: Documentation-only projection. No canon mutation. Single-page reference for utterance → task/ledger/comics loop, plus current Rules-based parsing surface in Task Editor.

## 0) Core Loop (Do Not Break)

Perception → Utterance → Episode → Meaning (12D) → Classification → {Task | Goal | Hypothesis | Observation | Memory | StrategySeed | Noise} → (optional) Task Instantiation → Activity → Metrics → Reports → Comics → Ledger → Story → back to Perception.

## 1) Stage Coverage (S0–S12)

- **S0 Perception (pre-U)**: Human-only, no system ops. Guard against notification-driven distortion.
- **S1 Utterance**: Raw text/voice capture (Spotlight, widget, shortcuts). Invariants: no judgment, no forced tasking.
- **S2 Speech Stabilize**: Light normalize; Utterance Wall (10-day persistence). Risk: over-normalize, early naming.
- **S3 Narrative Cohort**: Cluster into Episodes (“gravity wells”); Council read-only. Risk: false coherence.
- **S4 12D Projection (Irreversible)**: entity/action/context/intent/outcome/time/state/values/principles/relationships/meaning/station. Risk: premature collapse.
- **S5 Classification Gate (most terminate)**: → Memory, Observation, StrategySeed, Noise, or Task-candidate. Risk: task inflation.
- **S6 Task Instantiation (optional)**: Task = economic commitment; fields: LF, exposure, guilt_weight, recurrence, est_minutes. Risk: guilt loops, priority fetishism.
- **S7 Activity**: Doing/not-doing; observe-lite.
- **S8 Exhaust Capture**: time/mood/friction; no moral semantics. Risk: over-instrumentation.
- **S9 Reports**: compression (rings/bars/heatmaps). Risk: metric absolutism.
- **S10 Comics**: perception re-entry; emotion + causality; shareable. Risk: performativity.
- **S11 Ledger (Life P&L)**: credit/debit across domains; balance/drift. Risk: optimization pressure.
- **S12 Flywheel / Identity**: emergent arcs; social sharing; recursion into perception.

Critical gates to guard:
- A: S1→S3 (capture must not force meaning)
- B: S5→S6 (task inflation)
- C: S8→S9 (over-measurement → guilt)
- D: S9→S10 (comics must stay compression, not performance)

## 2) Task Editor Modes (UI Contract)

Modes: `CAPTURE`, `DETAILS`, `GRAPH`, `OPENROUTER` (Gemini/OpenRouter assist), `RULES` (local POS).

- **OPENROUTER (Gemini/OpenRouter Assist)**: Generates subtasks using POS keys (actor/action/time) + LF + Goal + Project context. Selection is explicit; user chooses to commit.
- **RULES (local POS / POST-GRAMMAR)**: Offline parser inspects title+notes for missing actor/action/time, suggests templates. No network. Applies LF/Goal/Project lens.
- **Capture/Details/Graph** remain unchanged; new modes must stay visually aligned and non-shifting on mobile.

## 3) Rules-Based Parsing Enhancements (to keep integrity high)

Current surface:
- Tokenize title+notes; heuristics for Verb/Noun/Time.
- Report missing slots; suggest templated phrasing.
- Allow “Apply template” to inject suggestion into the title (optional).

Enhance to full fidelity:
- **Keyed POS Checks**: Validate presence of actor (PRON/PROPN), action (VERB), object (NOUN/PROPN), time anchor (TIME/NUM+TIME), and optional modality (AUX) and location (ADP+NOUN).
- **Conditional Prompts**: If TIME missing → prompt “Add when (today/tomorrow/before <event>)”. If VERB missing → propose 3 strong verbs tuned to LF/Goal/Project. If OBJECT missing → propose object stub.
- **LF-Aware Templates**: Map LF domain to verb/object defaults (e.g., Grind → “Ship <artifact> by <time>”; Self → “Do <practice> for <duration>”).
- **Goal/Project Inheritance**: When a Goal/Project is selected, include its title in the suggestion template; avoid overwriting user text unless explicitly applied.
- **No Auto-Commit**: Suggestions must require explicit user apply; never auto-modify tasks.
- **Auditability**: Log (locally) which slots were missing and whether a template was applied (for UX tuning, not for moral scoring).

## 4) AI Assist (Gemini/OpenRouter) Integrity Notes

- Model is selectable (Gemini or OpenRouter) and should be displayed explicitly.
- Prompt must include POS keys + LF + Goal + Project + duration + notes; avoid hallucinated deadlines.
- Outputs are suggested subtasks only; commit requires explicit user action.
- Safe fallback: if API fails, keep RULES mode available (offline) so user is never blocked.

## 5) Safeguards Aligned to Canon

- Preserve “most utterances terminate at S5.”
- Keep Tasks optional; no forced instantiation in capture.
- Metrics are value-neutral; no guilt semantics.
- Comics remain compression; not a leaderboard.

## 6) Quick Integrity Checklist (for engineers)

- [ ] S1 capture has no forced classification or tasking.
- [ ] RULES mode flags missing actor/action/time and offers templates; does not mutate without consent.
- [ ] OPENROUTER/Gemini assist is opt-in, with clear engine label.
- [ ] Task creation path requires explicit commit; no silent conversions from utterance.
- [ ] Reports/Comics remain compression layers; no motivational scoring leakage.
