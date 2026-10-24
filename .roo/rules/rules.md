# Project Rules
- Project: Car Dealership Inventory System (full-stack, TDD take-home).
- Monorepo layout: /backend (Express + TypeScript + Prisma 6 + SQLite + Jest/Supertest) and /frontend (Vite + React + TS + Tailwind + Vitest/RTL).
- Strict TDD: when asked for tests, write ONLY failing tests. When asked to implement, write the minimum code to pass, then stop.
- Layered backend: routes -> controllers -> services -> repositories. Follow SOLID, use dependency injection via constructor params, no business logic in controllers.
- Clean code: meaningful names, short functions, concise comments/JSDoc on public functions.
- Validate input with Zod. Never log or return password hashes.
- NEVER run git commit or git push. The developer commits manually.
- Do not add features beyond what the current prompt asks for.
- After finishing, summarize what you changed and the commands to run.