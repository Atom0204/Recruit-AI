# RecruitAI

AI-driven resume-to-interview system scaffold built with Next.js, TypeScript, Turborepo, and Supabase-ready SQL.

## Quick Start

1. Install dependencies:
   - `pnpm install`
2. Create env file:
   - `cp .env.example apps/web/.env.local`
3. Run app:
   - `pnpm dev`
4. Open the app:
   - `http://localhost:3000` (or `http://localhost:3001` if 3000 is already in use)

## Workspace

- `apps/web`: Next.js App Router UI + API routes
- `packages/shared`: shared strict types and constants
- `packages/ai-service`: resume parser/JD/interviewer/report service stubs
- `packages/db-service`: Supabase client + query layer stubs
- `packages/proctoring-service`: proctoring engines and event generation
- `supabase`: schema + migration starter SQL

## Notes

- This scaffold is intentionally modular and strict-typed.
- API routes include basic request validation and in-memory rate limiting.
- Replace service stubs with provider SDK calls (OpenAI, Whisper, ElevenLabs, LangGraph) before production deployment.

## Troubleshooting

- Port already in use:
   - If `pnpm dev` reports port `3000` is busy, Next.js will auto-select `3001`.
   - Open the URL printed in terminal (`http://localhost:3001` in most cases).
- Missing API keys:
   - Ensure required variables are present in `apps/web/.env.local`.
   - Empty values are fine for initial UI checks, but API routes that call external providers may fail until keys are set.
- Interrupted dependency install:
   - Re-run `pnpm install` from repo root until it exits with code `0`.
   - Then validate with `pnpm lint && pnpm typecheck && pnpm build`.
