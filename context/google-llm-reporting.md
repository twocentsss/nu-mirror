# NuMirror Project Context — Google & LLM Integration

This topic file keeps the long-lived operational details about Google Sheet usage, story/reporting flows, and LLM key management.

## Sheet Tabs & Schema
* `src/lib/google/accountSpreadsheet.ts` seeds the account spreadsheet with `Meta`, `Episodes`, `Tasks`, `Worklogs`, `DecisionLogs`, `CaseBriefs`, `LLM_KEYS`, and `AI_PROMPTS`.  
* `src/lib/google/schema.ts` now documents a broader schema: `Tasks_Archive`, `Task_Events`, `FlowEvents`, `Story_Instances`, `COA`, `FlowEvents`, `SCORES_DAILY`, etc. All APIs rely on these tabs existing and having headers; the `/api/google/account/init` route rewrites header rows and caches the spreadsheet ID (`AccountSpreadsheetNotFoundError` is thrown otherwise).

## Flow & Reporting Data
* Ledger events (FlowEvents) are written via `src/lib/features/ledger/accounting.ts`. The reporting aggregator (`src/lib/reporting/aggregator.ts`) takes current + previous period FlowEvents, derives metrics (Workouts, Sweets, Family, Games), and supplies them to the CEO dashboard page (`src/app/(tabs)/reports/page.tsx`).  
* The plan is to extend sprint, bingo, social, business, and selling pages to also read from these ledger-derived metrics so “reports” tie to actual task scores and FlowEvents instead of static placeholders.

## LLM Keys & Metering
* Keys are stored in the `LLM_KEYS` tab. `src/lib/llm/keyStore.ts` exposes helpers to list, add, disable, and prefer keys plus mark daily limits and primary defaults.  
* `src/components/OpenAiKeyManager.tsx` renders each key with usage stats (tokens used, preferred marker) and provides inline add/disable/prefer actions.  
* Lease logic in `src/lib/llm/router.ts` ensures only non-cooled-down keys are used: it checks `inflight` and `preferred`, increments a counter, and requires callers (e.g., `/api/llm/complete`, `/api/ai/run`, `/api/story/generate`) to call `releaseOpenAiKey` once done. Future work must wrap leasing in `try/finally`.

## Story & Report Endpoints
* `src/lib/features/story/storyteller.ts` fetches FlowEvents for the day, builds a prompt, calls `openAiResponses`, and stores narrative rows in `Story_Instances`.  
* `/api/story/generate/route.ts` leases an OpenAI key, triggers the storyteller, and should release the key even on failure (needs a `finally`).  
* `/api/reporting` (future) should expose aggregated department data for UI pages (reports/sprint/bingo) and allow story/report scheduling to be triggered from the dashboard or CLI.
