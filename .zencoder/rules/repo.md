---
description: Repository Information Overview
alwaysApply: true
---

# nu-mirror Information

## Summary
A Next.js application built with TypeScript and React 19. It integrates with various AI services (Google GenAI, OpenAI, Xenova Transformers) and uses Upstash Redis for data storage. The project utilizes Tailwind CSS for styling and NextAuth for authentication.

## Structure
- **src/app**: Next.js App Router pages and layouts.
- **src/components**: Reusable React components.
- **src/core**: Core application logic and business rules.
- **src/hooks**: Custom React hooks.
- **src/lib**: Utility functions and external library configurations.
- **src/ui**: UI-specific components.
- **docs**: Project documentation.

## Language & Runtime
**Language**: TypeScript
**Version**: TypeScript v5, React v19
**Framework**: Next.js v16
**Build System**: Next.js CLI
**Package Manager**: npm

## Dependencies
**Main Dependencies**:
- **AI/ML**: `@google/genai`, `@xenova/transformers`, `openai`
- **Data/State**: `@upstash/redis`, `zustand`
- **UI/Styling**: `framer-motion`, `lucide-react`, `clsx`
- **Auth**: `next-auth`
- **Utils**: `compromise`, `ulid`, `googleapis`

**Development Dependencies**:
- `tailwindcss`, `@tailwindcss/postcss`, `postcss`
- `eslint`, `eslint-config-next`
- `typescript`, `@types/node`, `@types/react`

## Build & Installation
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint
```
