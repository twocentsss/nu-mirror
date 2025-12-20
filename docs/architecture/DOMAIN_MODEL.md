# Domain Model & Architecture

This document defines the canonical entities, relationships, and data structure for Project Nu. 
It is platform-agnostic (implementable in Postgres, Supabase, or advanced Sheets schemas).

**Conventions:**
* `id`: ULID/UUID
* `createdAt`, `updatedAt`: ISO timestamps
* `...Ref`: foreign key pointer
* **M:N** relationships use explicit join entities

---

## 0. Top-Level Concepts

The system has **one canonical substrate**:

1.  **WorldGraph Nodes**: Typed objects (Task, Episode, Strategy, etc.)
2.  **EventLog**: Append-only events that change nodes.
3.  **Projections**: Read models like Today, Week, Reports, Comics.

---

## 1. Identity & Workspace

### User
*   `id`, `provider` ("google"), `email`, `displayName`, `avatarUrl`, `timezone`
*   **Relationships**: 1:N Workspace, 1:N EventLog, 1:N Projections

### Workspace
*   `id`, `userId`, `name`, `mode` ("zen" | "classic" | "power")
*   **Relationships**: 1:N StorageRef, 1:N Corpus, 1:N Task, 1:N LedgerAccount

### StorageRef
*   `id`, `workspaceId`, `kind` ("google_sheets" | "postgres" | "local")
*   `meta` (JSON: driveFolderId, spreadsheetId, etc.)

---

## 2. Input Understanding

### Corpus
*   `id`, `workspaceId`, `source` ("manual" | "shortcut" | "import"), `rawText`
*   **Relationships**: 1:N Utterance, 1:N Episode

### Utterance
*   `id`, `corpusId`, `index`, `text`
*   `type` ("TASK_COMMAND" | "EVENT" | "NOTE" | "PROBLEM" | "PREFERENCE" | "EMOTION")
*   **Relationships**: M:N Episode (via EpisodeUtterance), 1:N Assertion

### Episode
(Cluster of utterances representing one “unit of meaning / mini-case.”)
*   `id`, `corpusId`, `title`, `status` ("open" | "resolved" | "archived")
*   `episodeType` ("capture" | "problem_case" | "weekly_plan" | "reflection")
*   **Relationships**: 1:N SCQAFrame, 1:N IssueTree, 1:N Pyramid, M:N Task

---

## 3. The 12D "Assertion" Layer

### Assertion
(The canonical atom of meaning.)
*   `id`, `workspaceId`, `text`, `confidence` (0–1)
*   `dims` (JSON): entity, action, context, intent, outcome, time, meaning, state, values, relationships, principles, station.
*   **Relationships**: M:N Episode, M:N Task, M:N LifeFocus

### LifeFocus (LF-9)
(Core, Self, Circle, Grind, LevelUp, Impact, Play, Insight, Chaos)
*   `id`, `workspaceId`, `key`, `label`
*   **Relationships**: M:N Task, M:N Assertion

---

## 4. Reasoning Objects (The Engine)

### SCQAFrame
*   `id`, `episodeId`, `situation`, `complication`, `question`, `answerHypothesis`
*   `strengthScore` (0-100)

### IssueTree & IssueNode
*   `id`, `episodeId`, `rootIssue`, `mode` ("algebraic" | "conceptual")
*   `nodes` (Tree structure: branch vs leaf)

### Hypothesis & Evidence
*   `id`, `episodeId`, `type` ("diagnostic" | "causal"), `status` ("untested" | "supported")
*   `evidence`: metric, quote, doc, observation

### Pyramid & PyramidNode
*   `id`, `episodeId`, `apexNodeId`
*   `nodes`: simple tree of DATA -> INSIGHT -> GROUP -> APEX

---

## 5. Strategy & Execution

### StrategyTemplate
*   `id`, `key` (e.g., "PSF_6"), `name`, `steps`

### StrategyInstance
*   `id`, `strategyTemplateId`, `episodeId?`, `taskId?`
*   `status`, `lisq` (JSON), `vector` (JSON)

### Task
*   `id`, `workspaceId`, `title`, `status` ("backlog" | "scheduled" | "in_progress" | "done" | "blocked")
*   `priority` (0-5), `dueAt`, `durationMin`
*   **Relationships**: M:N LifeFocus, 1:N TaskDependency, 1:N TaskEvent

### WeekPlan
*   `id`, `weekStartDate`, `status` ("draft" | "active"), `lfTargets` (JSON)
*   **Relationships**: M:N Task, 1:N Report, 1:N Comic

---

## 6. Story & Comics

### StoryWorld & Character
*   `id`, `theme`, `genre`
*   `characters`: name, role, traits

### Arc & Beat
*   `id`, `type` ("hero_journey"), `status`
*   `beats`: linkedTaskId, order

### Comic & ComicPanel
*   `id`, `weekPlanId?`, `styleKey`
*   `panels`: caption, sceneRef, assetRefs

---

## 7. Accounting & Rules

### MicroAdvice
*   `id`, `trigger`, `message`, `severity` ("silent" | "hint")

### RulePack & Rule
*   `id`, `name`, `active`
*   `rules`: when (pattern), if (predicate), then (action)

### LedgerAccount & LedgerEntry
*   `id`, `key` ("energy" | "time" | "focus")
*   `entries`: debit/credit, amount, unit, note

---

## 8. Event Sourcing & Projections

### EventLog
**(Canonical Truth)**
*   `id`, `workspaceId`, `actorUserId`
*   `type` (e.g., `TASK_CREATED`, `EPISODE_CREATED`)
*   `entityType`, `entityId`, `payload` (JSON)

### Projection
*   `id`, `name` ("today" | "week"), `version`, `outputRef`

---

## Mermaid Architecture

```mermaid
flowchart TB
  %% Nodes
  subgraph C[Clients]
    IOS[iOS/Web/Ext]
  end

  subgraph Z[Zen UI Contract]
    UI[One-Line Capture\nToday List\nGentle Feedback]
  end

  subgraph A[API & Auth]
    NEXT[Next.js API Routes]
  end

  subgraph B[Core Brain (Headless)]
    INGEST[Ingestion (Corpus/Utterance/Episode)]
    LOGIC[Reasoning (SCQA/Pyramid/Hypothesis)]
    STRAT[Strategy (Templates/Instances)]
    GAME[Gamification/Comics/Story]
    RULES[Rules/Advice/Ledger]
  end

  subgraph D[Data Spine]
    EVENT[EventLog (Canonical)]
    PROJ[Projections (Read Models)]
    SHEET[Google Sheets / Postgres]
  end

  %% Flows
  C --> UI
  UI --> NEXT
  NEXT --> INGEST
  INGEST --> EVENT
  EVENT --> LOGIC
  LOGIC --> STRAT
  STRAT --> EVENT
  EVENT --> PROJ
  PROJ --> NEXT
  NEXT --> C
```
