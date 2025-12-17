# Universal FlowEvent Specification

> The single canonical envelope that every module emits and consumes.

## The Schema

```typescript
type FlowEvent = {
  id: string;                  // ULID
  ts_start: string; 
  ts_end: string;
  unit: "min" | "usd" | "kwh" | "pts" | string;
  amount: number;

  // Two-sided invariant (GL-grade)
  source: { componentCode: string };   // Credit Side
  sink:   { componentCode: string };   // Debit Side

  // Segmentation (7 segments + context)
  segments: {
    // Zero Segment: The Balancing Dimension
    entity: "self"|"household"|"work"|"community"|string;
    context: "home"|"office"|"outside"|"commute"|string;
    mode: "deep"|"light"|"social"|"recovery"|string;

    // GL Segments
    financial_component?: string;
    component_group?: string;
    business_activity?: string;
    activity_type?: string;
    gl_line_description?: string;
    dr_cr?: "DR"|"CR"; 
  };

  // Content & Proof
  raw_text?: string;
  evidence?: Array<{ 
    kind: "calendar"|"receipt"|"location"|"device"|"manual"; 
    ref: string 
  }>;

  // Metadata
  matcher_id?: string;
  rule_ids?: string[];
  confidence?: number;

  // Versioning
  version: { 
    schema: string; 
    config: string 
  };
  reversal_of?: string;     // Adjustment linkage (append-only)
};
```

## Why this matters
*   **Tasks** are simply *planned* flows.
*   **Task Completion** is *actual* flow.
*   **Reflections** are annotations on flows.
*   **Comics** are rendered projections of flows.
*   **Games** are engagement flows.

**One pipe. Many views.**
