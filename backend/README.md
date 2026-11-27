# JHUB Africa Vault API

Express + TypeScript + Prisma + PostgreSQL backend for the existing Angular application.

## Setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL`, and `PORT`.
2. Ensure the existing remote `DATABASE_URL` is configured in `.env`, then run
   `docker compose up --build` from the repository root. Compose passes the
   backend environment through without creating or replacing a database.
3. Run `npm install` inside `backend/`.
4. Run `npx prisma generate`.
5. Run `npx prisma migrate deploy` for the existing migration history.
6. Run `npm run seed`.
7. Run `npm run dev`.

The API runs at `http://localhost:3000/api`. Development seed credentials are documented here only: `admin@jhubafrica.example` / `ChangeMe123!` and `innovator@jhubafrica.example` / `ChangeMe123!`. Change them before any real deployment.

Administrators can create a request on behalf of an innovator with `POST /api/admin/requests`. The endpoint accepts the normal request fields plus `innovatorId`, verifies that the user is an innovator and requested quantities are available, creates the request as pending, and records the action in the audit log.

## Ask HUB AI

Ask HUB AI is available to signed-in users through `POST /api/ai/chat`. It uses
an OpenAI-compatible chat-completions endpoint from the backend; the frontend
never receives the provider key. Configure `AI_API_KEY` in the backend's
server-only `.env` (or container environment). `AI_BASE_URL`, `AI_MODEL`, and
`AI_TIMEOUT_MS` can be set for a compatible provider; the defaults are shown
in `.env.example`. Do not put provider keys in Angular environment files or
commit them to source control.

The chat request includes the user's recent messages and is not persisted.
Available tools search live inventory, retrieve only the authenticated
innovator's own requests, prepare a request draft, explain verified Vault
workflows, and return a role-checked navigation intent. Request drafts are
reviewed in the existing Request Cart and request wizard; submission continues
through `POST /api/requests` and its normal validation and inventory checks.
The current request workflow has no cancellation endpoint or `CANCELLED`
status, so Ask HUB AI does not offer cancellation.

Do not run `prisma migrate reset`, delete applied migrations, or regenerate the baseline. For a deliberate schema change, create an additive migration, review it, apply it with `prisma migrate deploy`, and verify with `prisma migrate status`.

## Validation

```powershell
npm test
npm run build
npx prisma validate
npx prisma generate
npx prisma migrate status
```

Cloudinary and mail integrations are environment-driven. The API never returns password hashes or secrets.
