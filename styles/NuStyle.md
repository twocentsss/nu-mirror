# Nu Style Design Protocol

## Philosophy
The Nu Style is the "Instrumental" layer of the application. It is designed for daily use, high-frequency interaction, and "Zen" clarity. It emphasizes function, state, and reliability. This is the style for tools, dashboards, and active task management.

## Visual Language
- **Backgrounds**: Theme-aware CSS variables (`--bg-top`, `--bg-bottom`). Typically deep navy/black hues that feel softer than absolute black.
- **CSS Variables**:
  - Background: `var(--app-bg)`, `var(--bg-top)`, `var(--bg-bottom)`
  - Glass: `var(--glass-bg)`, `var(--glass-border)`
  - Text: `var(--text-primary)`, `var(--text-secondary)`
  - Accent: `var(--accent-color)`
- **Glass Classes**: `.glass-panel`, `.glass-card`
- **Typography**: Functional, clear hierarchy. Focuses on data readability (e.g., progress percentages, time strings).
- **Accents**: Specific colors for life-focus areas (LF) and functional states (e.g., Emerald for Done, Rose for Delete).

## Components
- **Task Rows**: Interactive items with swipe-to-complete, drag-to-delete, and inline progress sliders.
- **Circular Date Pickers**: Spatial, non-linear navigation for time.
- **Batch Bar**: Persistent, floating action panels that emerge when items are selected.
- **Swipe-to-Create**: Ambient gesture-based creation patterns.

## Motion
- **Physics-Based**: Drag-and-drop, elastic headers, and momentum-based scrolling.
- **AnimatePresence**: Smooth layout shifts as items are added, removed, or filtered.
- **Micro-Animations**: Toggle switches, pulse loaders, and checkmark pops.

## Usage
Use this style for:
- `/today`
- `/focus`
- Modal editors
- Any operational dashboard where utility and speed are paramount.
