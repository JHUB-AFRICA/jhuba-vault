# JHUB Africa Vault

JHUB Africa Vault is a full-stack asset management and component request system designed to help manage inventory, track assets, and streamline request workflows within JHUB Africa.

## Project Structure

```text
JHUB AFRICA VAULT/
├── frontend/                 Angular 21 Frontend
├── backend/                  Express + TypeScript Backend
├── docker-compose.yml
└── README.md
```

## Technology Stack

### Frontend
- Angular 21
- PrimeNG
- Tailwind CSS
- NgRx Signal Store

### Backend
- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication

---

## Getting Started

### Clone Repository

```bash
git clone <repository-url>
cd "JHUB AFRICA VAULT"
```

---

## Frontend Setup

```bash
cd frontend
npm install
npm start
```

Build for production:

```bash
npm run build
```

Frontend runs on:

```text
http://localhost:4200
```

---

## Backend Setup

```bash
cd backend
npm install
npm run dev
```

Build backend:

```bash
npm run build
```

Backend API runs on:

```text
http://localhost:3000/api
```

---

## Run Backend and Database with Docker

From the repository root, start the PostgreSQL database and API together:

```bash
docker compose up --build
```

The API waits for PostgreSQL to become healthy and applies pending Prisma
migrations before starting. It is available at `http://localhost:3000/api`;
the health endpoint is `http://localhost:3000/api/health`. The frontend
development server runs at `http://localhost:4200` and proxies `/api` requests
to the backend.

The Compose JWT secret default is for local development only. Set `JWT_SECRET`
in the shell or a root `.env` file to a strong secret before using the stack
outside local development.

For Cloudinary image uploads, create `backend/.env` and set
`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`.
Compose optionally passes this ignored local file to the backend container.
Never put Cloudinary credentials in frontend code or commit an environment
file.

Stop the services with `docker compose down`. Add `--volumes` only when you
intend to delete the persisted PostgreSQL data.

---

## Database Setup

Start PostgreSQL:

```bash
docker compose up -d postgres
```

Generate Prisma Client:

```bash
cd backend
npx prisma generate
```

Run migrations:

```bash
npx prisma migrate deploy
```

Seed database:

```bash
npm run seed
```

---

## Official Asset Register Import (Windows)

The register importer reads the workbook, performs a read-only dry run, and
holds incomplete rows and possible matches for review. It uses deterministic
row-based asset tags and preserves source values, including quantity units, in
the asset specifications. It never changes existing quantities or images.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\backend\scripts\prepare-asset-register.ps1" -WorkbookPath "C:\path\to\Copy of Office Inventory Data.xlsx"
```

The import includes a new `SOFTWARE` asset category. On an approved
development/staging database, apply the additive migration first, then set the
two safety variables and rerun with `-Apply`:

```powershell
Set-Location .\backend
$env:ASSET_REGISTER_DATABASE_URL = "<development/staging database URL>"
$env:DATABASE_URL = $env:ASSET_REGISTER_DATABASE_URL
npm.cmd exec -- prisma migrate deploy
$env:ASSET_REGISTER_TARGET = "development"
$env:ASSET_REGISTER_CONFIRM = "IMPORT_TO_NON_PRODUCTION"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\prepare-asset-register.ps1" -WorkbookPath "C:\path\to\Copy of Office Inventory Data.xlsx" -Apply
```

Do not set the write-confirmation variables for production. Resolve every
manual-review row against the source register and existing inventory before
trying to import those rows.

---

## Environment 