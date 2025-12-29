# LifeFocus Workbench: The Structured Problem Solving Pipeline

This application is a **Cognitive Workbench** designed to convert raw brain dumps into rigorous, execution-ready strategies. It follows a linear, 14-step pipeline that enforces structure on chaos.

## The 14-Step Pipeline

### Phase 1: Ingestion (Chaos to Order)

**1. Raw Input (Context)**
*   **Action**: Paste your unstructured brain dump, emails, or slack messages.
*   **Process**: The NLP (Natural Language Processing) engine scans for keywords like "Problem:", "Goal:", "Budget:", "Stakeholders:".
*   **Example**: _"The server is crashing every Tuesday (Conflict). We need to fix it by Friday (Goal). Budget is $0."_

**2. Raw Input (Tasks)**
*   **Action**: List potential to-dos or bullet points.
*   **Process**: The system auto-detects urgency ("ASAP"), effort ("Quick fix"), and priorities.
*   **Example**: _"- Check logs (Urgent)"_ becomes a High Priority Task with "logs" tag.

**3. NLP Segmentation & Classification**
*   **Internal Step**: The system breaks your text into sentences and sorts them into buckets: **Situation**, **Conflict**, **Question**, **Constraint**, or **Hypothesis**.
*   **Visual**: You see these populate the SCQA tab automatically.

---

### Phase 2: Structuring (Framing the Problem)

**4. SCQA Framing (Situation, Complication, Question, Answer)**
*   **Action**: Review the auto-generated frame.
*   **Goal**: Ensure the "Question" is the right one to solve.
*   **Example**:
    *   *S*: Users are happy.
    *   *C*: But retention dropped 10%.
    *   *Q*: How do we restore retention?
    *   *A*: (Your Recommendation).

**5. Constraints & Stakeholders**
*   **Action**: Define the "Box" you are playing in.
*   **Inputs**: Time, Budget (USD), Quality, Quantity, Approvers.
*   **Impact**: These constrain your Execution Helper later.

**6. MECE Issue Tree (Diagnosis)**
*   **Action**: Visualize the problem breakdown.
*   **Process**: The system builds a Live Graph showing `Context -> Hypotheses -> Recommendation -> Tasks`.
*   **Logic**: Mutually Exclusive, Collectively Exhaustive.

**7. 5 Whys Analysis (Deep Dive)**
*   **Action**: Drill down into a root cause.
*   **Example**: _Why crash? -> OOM. -> Why OOM? -> Leak. -> Why Leak? -> Bad loop._
*   **Output**: Identifying a **Root Cause** creates a "Fix Idea" node.
*   **Auto-Link**: A "Fix Idea" automatically spawns a **P1 Task**.

**8. Fishbone Diagram (Ishikawa)**
*   **Action**: Brainstorm causes by category (People, Process, Tech, Data).
*   **Linkage**: You can explicitly link a Fishbone Cause to a Task in the Task Editor.

---

### Phase 3: Planning (Strategy to Tactics)

**9. Task Definition & Estimation**
*   **Action**: Refine the auto-generated tasks.
*   **Fields**: Priority (1-9), Effort (mins), Confidence (%).
*   **Editor**: Define the "Definition of Done (DoD)" and "Next Physical Action".

**10. Advanced Scoring (SPS System)**
*   **Action**: The system calculates a **Sustained Productivity Score (SPS)** for every task.
*   **Formula**: `Impact (TW) * Confidence * Logic Multipliers = SPS`.
*   **Goal**: Chase the highest SPS, not just the "loudest" task.

**11. Prioritization Matrices**
*   **Visuals**:
    *   **MoSCoW**: Must / Should / Could / Won't (Auto-sorted by SPS).
    *   **Eisenhower**: Urgent vs Important.
*   **Use**: Decide what to **Drop**.

---

### Phase 4: Execution & Synthesis (Doing the Work)

**12. Execution Helper**
*   **Action**: Select a task to "Enter Mode".
*   **View**: Shows *only* the Next Action, timebox, and active constraints (e.g. "Budget: $0").
*   **Goal**: Anti-drift. Focus on one thing.

**13. Narrative Generation**
*   **Action**: "Generate Output".
*   **Output**: A prose paragraph explaining *why* you are doing this task, using the SCQA context. Useful for emails/updates.

**14. Reporting & Slide Deck**
*   **Outputs**:
    *   **Brief**: Executive summary.
    *   **Meeting Deck**: Auto-generated slide content (Title, Bullets) ready for copy-paste.
    *   **Report**: Status report format.

---

## Live Global Graph
At all times, the **Mermaid.js Graph** at the bottom of the screen remains the source of truth. It visually links:
`Situation` -> `Diagnosis (Fishbone/5Ys)` -> `Solution (Recommendation)` -> `Action (link dashed line)` -> `Task`.
