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
http://localhost:4300
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

## Environment 