# Project Nu: The Quantum OS for Human Potential

Welcome to **Project Nu** (nu-mirror).

Nu is a calm, AI-native platform designed to help you capture your thoughts, organize your life, and achieve your potential without the traditional stress of "task management."

## Quick Links
- 📖 **[Product Strategy & Guide](./PRODUCT.md)**: Features, Use Cases, and Philosophy.
- 🛠️ **[Engineering Deep Dive](./ENGINEERING.md)**: Architecture, Tech Stack, and Innovation.
- 📜 **[Zen Constitution](./docs/product/ZEN_CONSTITUTION.md)**: Our core product tenets.

---

## What is Nu?
Nu is built on the belief that **"Life gets lighter when you have a calm place to put your thoughts."**

It goes beyond simple lists by using a **12D Assertion Layer** and **LLM-powered reasoning** to automatically classify, prioritize, and narrate your daily life.

### Key Pillars
1. **Zen Capture**: One line in, zero decisions.
2. **LF-9 Framework**: Balanced growth across 9 Life Focus areas.
3. **Event-Sourced Brain**: Your life as an immutable log of progress.
4. **Narrative Engine**: Your week transformed into stories and comics.

---

## Getting Started

### Prerequisites
- Node.js 18+
- A Google Cloud Project (for SSO and optional Sheets integration)
- LLM API Keys (OpenAI, Gemini, or OpenRouter)

### Local Development
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment:
   ```bash
   cp .env.example .env.local
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000).

---

## Technology Stack
- **Framework**: Next.js 15
- **Language**: TypeScript
- **Database**: Postgres (Supabase) & Redis
- **AI**: OpenAI, Gemini, Anthropic, OpenRouter
- **Persistence**: Event Sourcing (EventLog)

---

## License
Confidential and Proprietary. All rights reserved.
