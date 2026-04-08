# AGENTS.md

## Mission
Complete the backend and all missing integrations for the existing Revo frontend so the system is fully functional end-to-end.

The frontend already exists in Next.js and reflects the intended product UI.
Your job is to make every visible interactive element functional with real backend logic, real database reads/writes, real AI generation, real ingestion, real analytics, and real Gmail integration.

## Product summary
Revo is an AI SDR system with:
- lead import and ingestion
- AI-generated outbound drafts
- scoring and approval workflow
- Gmail sending and reply sync
- RAG-backed business context
- analytics dashboard
- SDR workspace for review, regenerate, reject, edit, approve and send

## Non-negotiable architecture rules
- Keep a single Next.js repo.
- Do not create a separate backend repo.
- Use the existing frontend and adapt backend to it.
- Use Postgres as source of truth.
- All state changes must go through server-side backend/orchestrator logic.
- AI never directly mutates business state.
- Every button and visible interaction must be connected to real backend logic.
- No placeholder handlers.
- No fake data in production paths.
- Use seed/demo data only through proper seed scripts.
- Gmail thread/message IDs must always be stored.
- Negotiation/reply drafts must require approval before sending.
- If uncertain, save draft and flag for review instead of auto-sending.
- Keep code modular and production-oriented.

## Stack
- Next.js App Router
- TypeScript
- Tailwind
- Postgres
- Drizzle ORM or Prisma (choose one and use consistently)
- Gmail API
- Local LLM support
- Optional OpenRouter/Groq fallback
- RAG over structured business context and conversation memory

## AI architecture
Use a unified AI service layer:
- provider router
- local LLM adapter
- OpenRouter adapter
- Groq adapter
- prompt builder
- retrieval/context builder

Default mode:
- local-first
- fallback to OpenRouter/Groq only if configured

Supported tasks:
- outbound draft generation
- lead scoring explanation
- reply analysis
- reply draft generation
- follow-up draft generation
- analytics summaries if needed

## RAG architecture
RAG is required.
Use it for:
- offer details
- tone profile
- pricing rules
- forbidden claims
- objection handling rules
- past successful examples
- lead/thread-specific memory
- imported knowledge base content

Do not build a huge overcomplicated vector platform if not needed.
A pragmatic v1 is acceptable:
- structured tables
- embeddings for searchable chunks if useful
- retrieval by task type + lead/thread + business rules

## UI-to-backend rule
All visible controls in the existing frontend must map to real backend behavior.
Infer intended behavior from the screens and implement it.

## Definition of done
The task is only done when all of the following are true:
1. the app runs locally
2. the database schema is complete
3. import leads works with csv/xlsx upload
4. imported leads appear in UI
5. ingestion progress/status is functional
6. lead processing creates scores and drafts
7. SDR workspace is fully interactive
8. save draft works
9. regenerate works
10. reject works
11. edit works
12. approve and send works
13. Gmail integration sends real messages
14. replies can be synced from Gmail
15. replies are linked to the correct thread
16. reply analysis and reply drafting work
17. analytics screen is backed by real computed data
18. search and filters work
19. seed/demo data exists for development/demo visibility
20. lint passes
21. typecheck passes
22. build passes
23. key manual test steps are documented

## Working style
- Inspect the existing frontend first.
- Infer component intent from the UI.
- Create a backend plan before coding.
- Then implement systematically.
- Use small clear commits/diffs if possible.
- Do not declare completion early.