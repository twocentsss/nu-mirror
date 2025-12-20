# Zen Product Tenets (The Constitution)

This document defines the strict product philosophy for Project Nu. It is the "Monica Rulebook" for every contributor.

## 0. The Single Mental Model
If the user remembers **one sentence**, it is this:

> **“Nu is a calm place to put thoughts so your mind can rest.”**

It is NOT a task manager, a life OS, or a reporting platform. Those are *consequences*, not the identity.
Nu is a place where you write one word or one sentence, and your day slowly organizes itself.

---

## 1. Core Tenets

### 1) Core Promise
* **One line in → life gets lighter.**
* If a change makes the user feel heavier, it’s a regression.

### 2) Surface Area Discipline
* **UI primitives are only 3:** Capture → Today → Gentle feedback.
* Everything else must live behind **progressive disclosure** (earned, not forced).

### 3) Zero-Decision Onboarding
* **SSO + first entry = onboarding complete.**
* Never ask users to categorize, configure, or choose modes on day one.

### 4) Defaults Over Settings
* **No settings until there’s evidence of need.**
* Settings exist for exceptions, not as a starting experience.

### 5) Capture ≠ Commitment
* Every input is first treated as **a note**, not an obligation.
* Converting to “task with consequences” requires explicit user intent.

### 6) Calm, Non-Moralizing Tone
* The product never shames, nags, or moralizes.
* Sacred / identity / values content gets **gentle handling** (opt-in reminders only).

### 7) Assist Quietly, Explain Optionally
* Assistance should feel like **gravity**, not a supervisor.
* “Why?” exists, but it’s never required.

### 8) Complexity Belongs in the Engine
* Advanced logic is allowed only if it is **invisible by default**.
* UI shows projections, not raw machinery.

### 9) Progressive Power Ladder
* Users “level up” into power features **only after behavioral readiness**.
* No feature should appear just because it exists.

### 10) Trust is a Feature
* Data ownership is explicit: exportable, inspectable, reversible.
* The system must be safe to abandon and safe to return to.

---

## 2. Lifecycle Rules

### Requirements Gathering
* Write requirements as: **User job → minimal interaction → measurable relief.**
* Any requirement that adds steps must justify a **net reduction in user effort**.

### Design (UX/UI)
* Every screen must pass: **Can a tired user understand this in 3 seconds?**
* Prefer: single action, single next step, soft feedback, easy exit.
* No “dashboard-first” screens.

### Development & Zen Gates
* **Enforce "Zen Gates" in PR review:**
    * “Did this add a choice?”
    * “Did this add a new surface?”
    * “Can this be hidden behind auto-defaults?”
* Build features as **headless capabilities** with **optional UI entry points**.

### QA
* Add a test category: **Cognitive Load Regressions**
    * Taps to capture
    * Time-to-first-task
    * Number of decisions in first session
    * Number of interrupts / modals
* If a feature increases steps, QA flags it like a crash.

---

## 3. Persona Reminders

* **PM:** If it needs explanation, hide it.
* **Designer:** Reduce decisions, not pixels.
* **Engineer:** Build power, ship calm.
* **QA:** Treat added cognitive load as a bug.
* **Marketing:** Sell relief, not features.
* **Sales:** Pitch trust and simplicity first.
* **Support:** Default to fewer surfaces, fewer prompts.
