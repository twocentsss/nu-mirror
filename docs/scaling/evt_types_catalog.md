# Nu Event Types Catalog (v1)

This catalog defines the `type` and `body` shapes for the Nu Event Log. All events wrapped in the standard `Envelope`.

## 1. Task Domain
- **`task.created`**: Initial projection trigger.
- **`task.updated`**: Change in title, tags, or metadata.
- **`task.status_set`**: Transition (todo -> doing -> done).
- **`task.archived`**: Move to cold storage.

## 1.5 Quantum Domain (New)
- **`intent.captured`**: Raw thought storage (IntentAtom).
- **`option.generated`**: Superposition of choices (OptionSet).
- **`option.collapsed`**: Commitment event (Triggers `task.created`).

## 2. Activity & Narrative Domain
- **`activity.created`**: Canonical root for all user input.
- **`activity.updated`**: Refinement of semantics/metadata.
- **`utterance.added`**: Subsequent lines in an episode.
- **`story.generated`**: Result of narrative LLM worker.
- **`comic.rendered`**: Result of visual job completion.

## 3. Knowledge & Assist Domain
- **`assist.requested`**: User trigger for AI help.
- **`llm.call.logged`**: Audit trail for cost and latency.
- **`entity.tagged`**: NER results or manual linking.
- **`edge.added` / `edge.removed`**: Task/Entity graph modifications.
- **`search.performed`**: Audit log of global retrieval.
- **`index.upserted`**: Internal signal for vector/text index sync.

## 4. Ledger & Accountability Domain
- **`ledger.posted`**: Standard credit/debit entry.
- **`audit.segment.scored`**: Score calculation for one of the 7 segments.
- **`report.generated`**: Finalized accountability summary.

## 5. Social & Privacy Domain
- **`social.space.created`**: New shared context.
- **`social.wall.posted`**: Entry in a shared feed.
- **`social.partner.linked`**: Accountability partner handshake.
- **`acl.changed`**: Permission updates.
- **`provider.key.added`**: BYOK insertion (encrypted).
- **`no_data_ai.toggled`**: Router policy change.

## 6. Games & Platform Domain
- **`game.bingo.updated`**: Habit completion mark.
- **`game.sprint.updated`**: Focus cycle progress.
- **`platform.metric.ingested`**: DAU/Usage/Performance telemetry.
- **`feedback.submitted`**: User-provided sentiment/bugs.
- **`feature_request.submitted`**: Roadmap signals.
- **`third_party.connected`**: Integration auth success.
- **`store.item.upserted`**: Item listing in marketplace.

---

## Example Event Bodies (TONL)

### `task.status_set`
```tonl
{
  status: "done"
  prevStatus: "doing"
  reason: "completed_session"
}
```

### `ledger.posted`
```tonl
{
  amount: 50.0
  unit: "points"
  bucket: "grind"
  memo: "session_reward"
  refId: "task_uuid"
}
```

### `no_data_ai.toggled`
```tonl
{
  enabled: true
  policy: "e2ee_only"
  timestamp: 1734633600000
}
```
