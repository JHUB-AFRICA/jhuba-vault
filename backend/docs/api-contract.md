# API contract

All responses use `{ success, data }` on success and `{ success: false, message, error }` on failure. Base URL: `/api`.

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | Public | API health |
| POST | `/auth/register` | Public | Create innovator |
| POST | `/auth/login` | Public | Issue JWT |
| GET | `/auth/me` | Authenticated | Current user |
| GET/PATCH | `/users/me` | Authenticated | Read/update own profile |
| GET | `/assets`, `/assets/:id` | Public | Catalogue and detail |
| POST/PATCH/DELETE | `/assets`, `/assets/:id` | Admin | Asset CRUD |
| POST | `/requests` | Innovator | Create pending request |
| GET | `/requests`, `/requests/:id` | Authenticated | Own request list/details |
| GET | `/admin/requests` | Admin | Request queue |
| PATCH | `/admin/requests/:id/approve` | Admin | Approve and reserve inventory |
| PATCH | `/admin/requests/:id/reject` | Admin | Reject with reason |
| PATCH | `/admin/requests/:id/checkout` | Admin | Mark approved request checked out |
| PATCH | `/admin/requests/:id/return` | Admin | Return checked-out inventory |
| GET | `/admin/dashboard`, `/admin/inventory`, `/admin/users`, `/admin/audit` | Admin | Administration data |
