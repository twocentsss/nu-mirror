# NuMirror: Scaling to 10,000 Users (BYO Architecture)

This document outlines the architecture for NuMirror to scale to 10,000+ users while maintaining 100% data ownership and privacy via the **Bring Your Own Everything (BYO-E)** pattern.

## 1. Core Principles
- **No Global Bottlenecks**: No shared databases or global API keys for user data.
- **SSO for Discovery**: Google SSO is used only as an identity provider to locate the user's private "Discovery Map" (Google Sheet).
- **Infinite Scalability**: Since each user provides their own compute/storage/AI resources, the platform cost and load are distributed.

## 2. Resource Resolution Logic
The application resolves resources in this order:
1. **User Override**: If `DATABASE_URL` or `AI_KEY` is in the user's private Meta Sheet, use it.
2. **Encrypted Vault**: Decrypt keys stored in the user's private Sheet using the platform's `LLM_MASTER_KEY`.
3. **Internal Fallback**: (Optional/Free Tier) Use shared system resources for trial users.

## 3. Storage Hierarchy (BYODB)
To support 10k users, the application uses **Postgres as the Event Log** and **Redis for Read Models**.
- **Event Log**: `nu.event_log` stores all actions (Append-only).
- **Projections**: Materialized views (e.g., `projection_tasks`) are updated asynchronously.
- **Sheets**: Used primarily as a "Human Readable Backdoor" and for discovery.

## 4. AI & Add-ons (BYO-AI)
Users manage their own keys for:
- **OpenAI / OpenRouter / Gemini**: Distributed costs, no platform markup.
- **Encrypted Storage**: Keys are AES-256-GCM encrypted before being saved to the user's Sheet.

## 5. Domain Coverage
The following domains are being migrated to this event-driven BYO model:
- **Tasks & Today**: Done.
- **Reporting**: Done.
- **Social (Walls, Friends)**: In progress.
- **Games (Bingo)**: In progress.
- **Creative (Stories, Comics)**: In progress.

## 6. Implementation Checklist for 10k
- [x] **Dynamic DB Discovery**: `resolveStorageUrl`
- [x] **Dynamic AI Discovery**: `resolveAiConfig`
- [x] **Encrypted Secrets**: `encryptSecret` / `decryptSecret`
- [ ] **Background Projectors**: Move Sheets projection to a queue.
- [ ] **Tenant Isolation**: Strictly enforce `tenant_id = user_email` in all queries.
