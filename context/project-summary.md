# NuMirror Project Context — Overview

This folder centralizes evergreen context about the NuMirror product so new contributors and future work can land faster. Keep each topic-focused file updated whenever architecture decisions or story flows change.

## Architecture At A Glance

1. **Task + Life Focus Lens**  
   * The primary task workflow lives under `src/app/(tabs)/today` and is backed by the Google Sheet `"Tasks"` tab. Tasks are mapped to `Life Focus (LF)` pillars via `src/lib/core/accounting.ts`, scored by `src/lib/actions/scoring.ts` (which uses `mapTaskToScoringParams` → `calculateTaskScore`), and surfaced with the `TaskEditorModal` in the UI.
   * Focus-related tabs (Social, Business, Selling, Focus) currently render placeholder cards but are meant to reuse `scoreSingleTask`, FlowEvents, and the Chart of Accounts defined in `docs/vault/Strategy/Chart_of_Accounts.md` and `docs/vault/Strategy/Life_Focus.md`.

2. **Google Sheet Backbone**  
   * The per-user spreadsheet (`NuMirror Account – <email>`) is managed via `src/lib/google/accountSpreadsheet.ts`, which ensures `Meta`, `Episodes`, `Tasks`, `Worklogs`, `DecisionLogs`, `CaseBriefs`, `LLM_KEYS`, and `AI_PROMPTS` tabs exist with the right headers.
   * CRUD helpers in `src/lib/google/sheetStore.ts` (append, read, update, delete) wrap Google Sheets API calls with retry/backoff. The schema manifest lives in `src/lib/google/schema.ts` and now defines additional tabs required by new features (`Tasks_Archive`, `Task_Events`, `FlowEvents`, `Story_Instances`, etc.).

3. **LLM + Reporting Stack**  
   * Key leasing/routing happens through `src/lib/llm/router.ts`, which consults the `LLM_KEYS` sheet via `src/lib/llm/keyStore.ts`. UI surface is handled by `src/components/OpenAiKeyManager.tsx`.
   * `src/app/api/llm/complete/route.ts` orchestrates key leasing, provider fallbacks (Gemini, OpenRouter, OpenAI), and usage logging; `/api/story/generate` is the newer endpoint that generates narratives via `generateDailyReplay` (`src/lib/features/story/storyteller.ts`).
   * Reporting aggregator `src/lib/reporting/aggregator.ts` compiles FlowEvents into department reports rendered by `src/app/(tabs)/reports/page.tsx`.

4. **Nav & Task Flows**  
   * The infinite BottomNav uses a single item list with true wrap logic (`src/ui/BottomNav.tsx`), while `SwipeToCreate` plus `TaskEditorModal` manage journal navigation.  
   * Task lifecycle APIs under `src/app/api/cogos/task` (list/create/update/delete/bulk-create/decompose) continue to drive Today’s view and will be reused by Focus, Sprint, Bingo, and social/business dashboards.

## Outstanding P1 focus
1. Replace `TabTitlePage` placeholders (Social/Business/Selling) with data-driven dashboards tied to `FlowEvents`, story narratives, and task scores.  
2. Build shared controller/services that expose FlowEvent/Story summaries (the “P11” alignment).  
3. Harden the Focus tab so it selects active tasks, logs focus sessions, and calls `scoreSingleTask` for streak accounting.
