# TukTuk Tracking API


| **NIBM Index** | COBSCCOMP242P-050 |
| **Coventry Index** | 16115860 |

REST API for registering three-wheelers (tuk-tuks), police station hierarchy, device API keys, and GPS location ingestion (live + history). Built with **Node.js**, **Express**, **Prisma**, and **PostgreSQL**.

---

## Prerequisites

- **Node.js** 18+ (20 LTS recommended)
- **PostgreSQL** database (local, Docker, [Neon](https://neon.tech), etc.)
- **npm** (comes with Node)

---

## Quick start

### 1. Clone and install

```bash
git clone <your-repository-url>
cd tuktuk-tracking-api
npm install
```

### 2. Environment variables

Copy the example file and edit values:

```bash
cp .env.example .env
```

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string (often with `?sslmode=require` for cloud DBs) |
| `JWT_SECRET` | Yes | Long random string used to sign JWTs |
| `PORT` | No | Server port (default `3000`) |
| `CORS_ORIGIN` | No | Allowed browser origin(s); defaults to `*` |
| `RATE_LIMIT_MAX` | No | Max requests per IP per 15 min (global); default `300` |
| `AUTH_RATE_LIMIT_MAX` | No | Extra limit for `/auth` routes; default `30` |

Never commit `.env` or real credentials.

### 3. Database schema

Generate the Prisma client and apply migrations:

```bash
npx prisma generate
npx prisma migrate deploy
```

For local development you can use:

```bash
npm run prisma:migrate
```

(which runs `prisma migrate dev` and can prompt for migration names when the schema changes).

### 4. Seed demo data (optional)

Populates provinces, districts, stations, sample users, ~200 tuk-tuks, and synthetic locations. **This clears existing data** in the tables the script touches.

```bash
npm run prisma:seed
```

### 5. Run the server

```bash
npm start
```

You should see: `TukTuk Tracking API listening on port 3000` (or your `PORT`).

---

## Useful URLs (local)

| Resource | URL |
| --- | --- |
| API base | `http://localhost:3000` |
| Health / status | `GET http://localhost:3000/api/status` |
| Swagger UI | `http://localhost:3000/api-docs` |

---

## Demo logins (after seed)

These are created by `prisma/seed.js` for testing only. Change or remove them in production.

| Role | Email | Password |
| --- | --- | --- |
| Super admin | `admin@example.com` | `Admin@123` |
| Police (station-scoped) | `police@example.com` | `Police@123` |

Authenticate with `POST /auth/login` (JSON body: `email`, `password`). Use the returned JWT as `Authorization: Bearer <token>` on protected routes.

---

## NPM scripts

| Script | Command |
| --- | --- |
| Start API | `npm start` |
| Prisma Client | `npm run prisma:generate` |
| Migrations (dev) | `npm run prisma:migrate` |
| Seed database | `npm run prisma:seed` |
| Prisma Studio (DB GUI) | `npm run prisma:studio` |

---

## Project layout (overview)

- `server.js` — Express app entry, middleware, route mounting
- `src/routes/` — HTTP routes and input validation
- `src/controllers/` — Request/response handling
- `src/services/` — Business logic and Prisma access
- `src/middleware/` — Auth, device API key, validation, errors
- `prisma/schema.prisma` — Data model
- `prisma/migrations/` — SQL migration history
- `src/config/swagger.js` — OpenAPI spec for `/api-docs`

---

## API overview

- **`/auth`** — Login, current user (`/me`), logout (JWT blacklist)
- **`/users`** — User CRUD (role-based; hierarchical creation rules)
- **`/policestations`** — Police stations (read for scoped roles; write super-admin)
- **`/tuktuks`** — Tuk-tuk CRUD + filtered list (`/tuktuks/filters`)
- **`/devices`** — Device registration, API key rotate/revoke
- **`/locations`** — Device POST to submit GPS; JWT GET for live + history
- **`/api`** — Lightweight status endpoint

Device location writes use the `x-api-key` header (format: `deviceId.secret` returned when a device is created or rotated). Request bodies for writes should be **JSON** (`Content-Type: application/json`).

Full detail: open **Swagger** at `/api-docs` or inspect route files under `src/routes/`.

---

## Troubleshooting

- **`JWT_SECRET is not configured`** — Set `JWT_SECRET` in `.env` and restart.
- **Database connection errors** — Check `DATABASE_URL`, firewall, and SSL options (`sslmode=require` for many hosted providers).
- **Prisma errors after pulling code** — Run `npx prisma generate` and `npx prisma migrate deploy`.
- **Empty data** — Run `npm run prisma:seed` (remember it resets seeded tables).

---

## License

ISC

## Super_Admin login credentials are provided for testing
email - nimal@example.com
password - 12345678