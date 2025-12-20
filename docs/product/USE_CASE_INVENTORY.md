# Use Case Inventory

This document lists all system use cases organized by **Domain**, **Feature**, and **Life Focus**.
It serves as the functional requirements checklist.

---

## 1. Domain Use Cases

### A) Platform
*   **P1. Zero-decision onboarding**: SSO -> Capture -> Today.
*   **P2. Background data spine**: Silent Sheet checks.
*   **P3. Projection runtime**: Build Today/Week views.
*   **P4. Data control**: Export/Delete/Audit.
*   **P5. Offline queue**: Capture anywhere.
*   **P6. Zen gates**: Enforce UI simplicity.
*   **P7. Observability**: Metrics (Recall, Nag Rate, Load Delta).

### B) Account
*   **A1. Auth**: Google SSO.
*   **A2. Preferences**: Timezone, Calmness Level.
*   **A3. Billing**: Free vs Paid tiers.

### C) Life Focus (LF)
*   **LF1. Auto-classify**: Text -> LF inference.
*   **LF2. Manual override**: Change LF later.
*   **LF3. Balance diagnostics**: Weekly distribution.
*   **LF4. LF Defaults**: Specific templates per LF.

### D) Modules (Projections)
*   **M1. Tasks**: CRUD + status.
*   **M2. Goals**: Milestones.
*   **M3. Planning**: Weekly plan, jars.
*   **M4. Reporting**: Daily/Weekly.
*   **M5. Story**: Narrative arcs.
*   **M6. Comics**: Panel generation.
*   **M7. Gamification**: Bingo, Quests.
*   **M8. Ledger**: Credits/Debits.

---

## 2. Feature Use Cases

### POS-Tagging
*   **F1. Parse capture**: Verbs/Nouns/Entities.
*   **F2. Identify candidates**: "pay bill" -> Task.
*   **F3. Detect sentiment**: "need" vs "want".

### Categorizing
*   **C1. Activity Type**: Note/Event/Task.
*   **C2. LF Classify**: Core/Self/Circle...
*   **C3. Urgency**: Quick vs Deep.
*   **C4. Ethics**: Identify sacred/guilt content.

### Planning
*   **PL1. Day Projection**: Today list.
*   **PL2. Week Projection**: Outcomes + Capacity.
*   **PL3. Jar Fitting**: Time blocking.
*   **PL4. Habit Scaffolding**: Defaults.

### Act (Execution)
*   **EX1. Quick complete**: Swipe done.
*   **EX2. Focus session**: Timer lock.
*   **EX3. Delegation**: Send to others.
*   **EX4. Close day**: Gentle reset.

### Scoring & Reporting
*   **SC1. Net Workload Delta**: Life lighter?
*   **SC2. Focus Integrity**: Interruptions avoided.
*   **R1. Daily/Weekly Reports**: Summaries.
*   **R2. Explanation**: "My week in review".

### Narrative & Game
*   **ST1. Story Arcs**: Struggle -> Resolution.
*   **CG1. Comics**: 1-panel / 3-panel generation.
*   **GAM1. Bingo**: Task grid.
*   **GAM2. Quests**: Streak rewards.

---

## 3. Life Focus Behavior Matrix

| Domain      | Capture Focus | Plan Style | Report Tone | Game Mechanic |
| :---        | :---          | :---       | :---        | :---          |
| **CORE**    | Chores, Bills | Routine    | "House in order" | Bingo Cells |
| **SELF**    | Body, Mind    | Consistency| No shame    | Quest Chain   |
| **CIRCLE**  | Family, Friends| Touchpoints| Warmth      | Social Cards  |
| **GRIND**   | Work, Admin   | Deep Work  | Status Update | Sprint Cards |
| **LEVEL UP**| Skills, Biz   | Pipeline   | Growth      | XP Gain       |
| **IMPACT**  | Volunteer     | Commitment | Impact Log  | Badges        |
| **PLAY**    | Joy, Travel   | Guilt-free | "Joy Ledger"| Rewards       |
| **INSIGHT** | Ideas, Reading| Slots      | Learned     | Insight Bingo |
| **CHAOS**   | Rants, Fires  | Triage     | Survival    | Shield        |

---

## 4. Activity Types (Canonical)

1.  `CAPTURE_NOTE` (Thought)
2.  `TASK_INTENT` (Action)
3.  `EVENT_FACT` (Time)
4.  `REFLECTION` (Emotion/Value)
5.  `PROBLEM_CASE` (Complex)
6.  `DECISION` (Choice)
7.  `PROGRESS` (Update)
8.  `EVIDENCE` (Prof/Link)
