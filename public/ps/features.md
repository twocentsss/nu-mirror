# LifeFocus Workbench – Feature Inventory (Hydrated)

Organized by phase/view with exit criteria to guard against regression.

## Global & Shell (index.html, css/style.css, js/app.js)
- Sticky top bar with mode label and primary action `Parse → Build → Prioritize`.
- Dynamic nav tabs for 15 routes (Phase0 through Meeting) with client-side routing.
- Shared card UI, chips/pills, KPI blocks, tables, gradient styling.
- Persistent Mermaid Live Structural Map that rebuilds on model changes and links tasks to analysis nodes.
- Data model lives in `js/model.js` with sample defaults, run pipeline, NLP parsing, scoring, outputs, and tree builders.

## Phase 0 (phase0 view)
- Definitions ledger and claim ledger UI (tabs/add/remove) present in view data; hydration not implemented.
- Exit: currently none (non-functional). To ship: add hydratePhase0 to persist definitions/claims in MODEL.

## Input (01_input)
- Raw Context textarea with quick-insert chips; NLP parses SCQA, constraints, stakeholders.
- Raw Tasks textarea (one per line) with auto detection of priority/due/effort/impact/tags.
- “Load Example” resets to SAMPLE; debounced autorun refreshes pipeline and graph.
- Exit: context/tasks entered; pipeline autoran (graph refresh, console log); Mode shows “Input”.

## SCQA (02_scqa)
- Editable situation, conflict, question, answer fields.
- Constraints editor (time, quality, quantity, budget, stakeholders).
- Hypotheses and assertions lists with add/delete; edits propagate into tree and outputs.
- Auto-regeneration of visuals on change.
- Exit: SCQA fields populated; constraints set; at least one hypothesis exists; tree reflects updates.

## Structure (03_structure)
- Subtabs: MECE tree (global graph), 5 Whys, Fishbone.
- 5 Whys editor: five why prompts, root cause, fix idea; regen from SCQA; updates tree and tasks (fix idea may spawn task).
- Fishbone editor: per-category causes with add/edit/delete; IDs used for task linkage.
- MECE tree generated from SCQA, hypotheses/assertions, fishbone, 5 Whys, tasks, and constraints.
- Exit: Mermaid graph renders; context/diagnosis/solution/constraints/task nodes present; dashed links for linked tasks.

## Planning / Tasks (04_planning)
- Task table with status/priority/meta display; row selection.
- Task editor: status, priority, due, effort, confidence, tags, owner, next action, DoD, blockers.
- Analysis linkage dropdown (hypotheses, fishbone causes, 5 Whys root) adds dashed edges to graph.
- Full scoring inputs (TW/CP/SM/ESF/QM/SF/BP) with recompute; per-task outputs (narrative/report/story/comic) generation; add/delete task; select for execute.
- Exit: tasks present; selected task populated with meta + next action + DoD + blockers; SPS recomputed; analysis link set as needed.

## Prioritize (05_prioritize)
- MoSCoW buckets computed from impact/confidence/effort/urgency; recompute button.
- Eisenhower matrix (urgent vs important) driven by due dates and priority/impact.
- Exit: both matrices populated; recompute works without error.

## Execute (06_execution)
- Focus view for selected task: status/priority/effort, constraints in force, next action, timebox suggestion, blockers, DoD, execution note logger.
- Exit: selected task visible; constraints rendered; execution plan populated; log button usable.

## Score (07_score)
- KPI cards for Avg SPS, total tasks, done count; scoring legend for TW/CP/SM/ESF/QM/SPS.
- Exit: KPIs show expected counts/avg.

## Narrative Build / Make (08/09)
- Narrative Builder textarea with “Pull from selected task” and save; stores global narrative output.
- Make Narrative page provides freeform refinement area (bindings minimal).
- Exit: narrative stored in MODEL.outputs.narrative; pull/save buttons operate; make-page editable text present.

## Story / Comics / Reports (10/11/12)
- Textareas for story, comic beats, and report outputs bound to MODEL outputs; editable manually.
- Exit: outputs visible/editable; per-task outputs can be regenerated from Planning editor.

## Brief (13)
- Executive brief page shows KPIs and textarea; binding to generated brief not wired (current static content).
- Exit: currently static placeholder only. To ship: add `id="outBrief"` and bind to MODEL.outputs.brief.

## Meeting (14)
- Executive meeting placeholder slide; hydration expects `meetingWrap` that is absent in view markup (output currently static).
- Exit: currently static placeholder only. To ship: add `meetingWrap` and render MODEL.outputs.meeting slides.

## Generators & Analytics (js/model.js)
- NLP segmentation/classification of sentences; constraint/stakeholder sniffing; task parsing from bullets or prose.
- Task scoring: computes BPS/APS/SPS with clamp/rounding; due urgency heuristic.
- Prioritization: ranks tasks then fills MoSCoW/Eisenhower.
- Generators: narratives, reports, stories, comics per task; executive brief; meeting deck slides; fishbone auto-build; MECE tree assembly by framework cues (profitability/market entry/M&A) plus SCQA artifacts; auto task from 5 Whys fix idea.
- Exit: `runPipeline`/`runGeneration` complete without errors; MODEL._meta.lastRunAt updates; outputs populated (first task drives narrative/report/story/comic).

## Known Gaps / Risks
- `hydratePhase0` and `log()` functions missing; Phase 0 non-functional.
- Duplicate definitions of `runPipeline`/`runParseInput`/`runGeneration` in model.js can confuse flow.
- Brief/Meeting views lack IDs (`outBrief`, `meetingWrap`) expected by hydration; outputs not rendered.
- Narrative Make is unbound beyond raw textarea.
- Mode label/navigation rely on ROUTES; ensure any added views update ROUTES + VIEWS_DATA together.
