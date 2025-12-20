# System End-to-End Walkthrough

This document traces a single concrete corpus through the Nu system to demonstrate "The Illusion" vs "The Engine".

## 0. The Input (Raw Corpus)
**User Input**:
1. "in one sentence, I need second brain for my todos so I can keep my focus time intact."
2. "remind me to tell Keerthi about book I am reading."
3. "pay dentist bill"
4. "clean work desk"
5. "Mahesh’s wedding is on 22 feb"
6. "Seahawks vs Rams this weekend"
7. "(meta feedback about guilt, religion, overload, smart assistant)"

---

## 1. Layer 1: The Linguistic Engine
*(Corpus -> Utterances -> Episodes -> 12D Grammar)*

### 1.1 Extraction
*   **U1**: "I need second brain..." (Problem statement)
*   **U2**: "remind me to tell Keerthi..." (Task)
*   **U3**: "pay dentist bill" (Task)
*   **U4**: "clean work desk" (Task)
*   **U5**: "Mahesh wedding..." (Event)
*   **U6**: "Seahawks vs Rams..." (Event)
*   **U7**: "meta feedback..." (Reflection)

### 1.2 Grouping (Episodes)
*   **E1 (Core Problem)**: U1.
*   **E2 (Actionable)**: U2, U3, U4, U5, U6.
*   **E3 (Guardrails)**: U7.

### 1.3 12D Tagging (Example: E1)
> "This is not a task. This is a governing problem."
*   **Intent**: Preserve focus.
*   **State**: Overwhelmed.
*   **Outcome**: Reduced load.

---

## 2. Layer 2: The Logical Engine
*(SCQA -> Issue Tree -> Hypotheses)*

### 2.1 SCQA (for E1)
*   **Situation**: User has many thoughts.
*   **Complication**: Capture breaks focus.
*   **Question**: Can we capture without interruption?
*   **Answer**: "Capture must be single-gesture, zero-decision."

### 2.2 Pareto Insight
*   Top Driver of focus loss = **Capture Friction**.
*   **Strategy**: "A second brain must capture instantly and organize later."

---

## 3. Layer 3: The Action Engine
*(Strategy -> Tasks -> Ledger)*

### 3.1 Task Generation (from E2)
| Task | Type | LF |
| :--- | :--- | :--- |
| Tell Keerthi | Reminder | Circle |
| Pay dentist | Chore | Core |
| Clean desk | Chore | Core |
| Wedding | Event | Circle |

### 3.2 Ledger Check
*   **Credits**: Focus preserved (by using Nu).
*   **Debits**: None yet.
*   **Net State**: Positive.

---

## 4. Layer 4: The Zen UI (The Illusion)
*What the user actually sees.*

### Screen 1: Capture
*   User types: "Pay dentist bill"
*   System: Silently tags `LF=Core`, `Type=Chore`.
*   UI: Shows "Pay dentist bill" in **Today**. Faint "Saved."

### Screen 2: Planning (Quantum)
*   System: Knows "Clean desk" has 2m/10m options.
*   UI: Shows "Clean desk".
*   Context: 15m gap appears.
*   UI Suggestion: "Quick tidy? (10m)"

### Screen 3: End of Day (Reporting)
*   System: Calculates Net Workload Delta.
*   UI: "You captured 5 things. Mind is clear."
*   **Comic Panel**: A stick figure dropping a heavy bag. "Phew."

---

## 5. Layer 5: Assistant & Feedback
*(Micro-Opinion Engine)*

**Trigger**: "Pay dentist bill"
**Rule**: Chore + Short duration.
**Output**: "Pair with cleaning desk?" (Gentle hint).

**Trigger**: Religious/Guilt content (E3)
**Rule**: Value = Sacred.
**Output**: **Silence**. (Do not gamify).

---

## Summary
1.  **Input**: Raw chaos.
2.  **Engine**: Deep structure (SCQA, 12D, Strategy).
3.  **UI**: Extreme simplicity (Zen Mode).
4.  **Result**: "Life gets lighter."
