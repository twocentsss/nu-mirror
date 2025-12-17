# NuMirror Task Board for Development

This board mirrors a simple Jira-style backlog. Each task is labeled with a priority code (P1/P2/P3) and, where needed, a second-order priority marker (P11) to keep the most urgent work near the top.

## P1 – Mission-Critical
1. **P1 – Build Social/Business/Selling experiences**
   * Replace the TabTitlePage placeholders with data-driven dashboards that pull from the Google Sheet (FlowEvents, Task scores, Story instances) and highlight the corresponding Life Focus pillar (Social, Business, Selling).
2. **P11 – Sync Social Business Sell with Google data**
   * Create shared controller/services that query the ledger tabs (`FlowEvents`, `Story_Instances`, etc.) so every view can render live charts, narratives, and score buckets without stale placeholders.
3. **P1 – Harden Focus tab**
   * Integrate the Today task/LLM/score stack: allow selecting an active task, starting/stopping a timer, logging focus sessions, and invoking `scoreSingleTask` for streak tracking within the UI.

## P2 – Health & Reliability
1. **P2 – Story/report hooks and durable keys**
   * Add UI hooks (buttons or scheduled runners) that call `/api/story/generate` and the reporting aggregator, ensuring real narratives/reports can be triggered from the UI.
   * Wrap the `leaseKey`/`releaseOpenAiKey` usage in `/api/story/generate/route.ts` with a `try/finally` so leased secrets are always released even on LLM failure.
2. **P2 – Ledger/Reporting alignment**
   * Tie sprint planning, bingo, and reports to actual task scores: ensure sprint/gamification views read from scored tasks or FlowEvents (not dummy data) so dashboards match the doc’s accounting model.
3. **P2 – Validate Google Sheet schema**
   * Confirm that tabs defined in `src/lib/google/schema.ts` (`Tasks_Archive`, `Task_Events`, `FlowEvents`, `Story_Instances`, etc.) exist for each user sheet and seed them via `/api/google/account/init` so the new APIs never fail.

## P3 – UX & Admin Notes
1. **P3 – LLKey Manager polish**
   * Surface key toggles for disable/default selection plus daily token usage per provider as per the admin spec (OpenAI/OpenRouter/Gemini). Expand the UI to show the “Key 2/OpenRouter/Gemini” descriptors and allow adding new keys inline so testing is easy.
2. **P3 – Sprint/Reports/Bingo overhaul**
   * Rebuild the sprint/Reports/Bingo pages so they operate off task scores, earned FlowEvents, and planned tasks rather than static placeholders—align narrative, scoring, and UI copy with the documented strategy.
3. **P3 – Infinite Dock tuning**
   * Continue refining the BottomNav “throw” physics to keep momentum and wrap mathematics stable while making sure accessibility/keyboard events still navigate correctly.
