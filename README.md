# 🏥 EVE Healthcare — Diagnostic Test Booking & Simulated Payment Service

> **SDE Intern / Backend Engineering Assignment Submission**  
> A production-grade backend service and interactive web application for diagnostic test bookings, simulated payment processing, and idempotent payment webhooks.

---

## 🛠️ Tech Stack & Technologies Used

Everything used in this project was selected for type safety, maintainability, production reliability, and developer experience:

### ⚙️ Backend Core
- **Runtime**: [Node.js](https://nodejs.org/) (v20+) — Asynchronous, event-driven JavaScript/TypeScript runtime.
- **Language**: [TypeScript](https://www.typescriptlang.org/) (v5.9+) — Strict static typing preventing runtime errors and ensuring type-safe API contracts.
- **Framework**: [Express 5](https://expressjs.com/) — Fast, unopinionated web framework configured with modular routing and global error handling.
- **Execution**: [`tsx`](https://github.com/privatenumber/tsx) — Zero-config TypeScript execution with hot-reloading for development.

### 🗄️ Database & ORM
- **ORM**: [Prisma ORM](https://www.prisma.io/) (v5.22+) — Next-generation type-safe ORM with automated migrations, relational querying, and atomic `$transaction` support.
- **Databases**:
  - **SQLite** (`file:./eve_healthcare.db`) — Preconfigured by default for instant, zero-friction local development and running automated tests without needing a running database server.
  - **PostgreSQL 16** (`schema.postgresql.prisma`) — Supported as the assignment's preferred production database with strict relational schemas, foreign key cascades, and `DECIMAL(10,2)` monetary precision.

### 🔒 Security, Validation & Utilities
- **Data Validation**: [Zod](https://zod.dev/) — Strict schema validation for request bodies, query strings, URL parameters, and startup environment variables.
- **Authentication**: [JSON Web Tokens (JWT)](https://jwt.io/) & [bcryptjs](https://github.com/dcodeIO/bcrypt.js) — Stateless JWT-based authentication with salted password hashing (cost factor 10) and Role-Based Access Control (`PATIENT`, `ADMIN`).
- **Webhook Security**: Node.js `crypto` HMAC-SHA256 signature verification with `crypto.timingSafeEqual` to prevent timing attacks.
- **Rate Limiting**: `express-rate-limit` — IP-based sliding window rate limiter (200 reqs/15m) to prevent DoS attacks.
- **CORS**: `cors` — Cross-Origin Resource Sharing enabled for frontend communication.
- **Logging & Tracing**: `morgan` HTTP access logger and custom UUID `X-Request-ID` tracing middleware for request correlation.
- **API Documentation**: [Swagger UI Express](https://github.com/scottie1984/swagger-ui-express) — Interactive OpenAPI documentation served directly at `/api/docs`.

### 🧪 Automated Testing
- **Test Runner**: [Jest](https://jestjs.io/) (v30+) with `ts-jest` for TypeScript test execution.
- **HTTP Assertion**: [Supertest](https://github.com/ladjs/supertest) — High-level HTTP abstractions for integration testing.
- **Coverage**: 30 comprehensive integration tests covering Auth, Catalog, Bookings, Payments, and Webhook Concurrency Race Conditions.

### 💻 Frontend Application
- **Framework**: [React 18](https://react.dev/) + Plain JavaScript.
- **Build Tool**: [Vite](https://vitejs.dev/) — Lightning-fast HMR and bundle optimization.
- **Icons**: [Lucide React](https://lucide.dev/) — Modern, lightweight UI icon library.
- **Styling**: Modern Vanilla CSS Design System with dark mode, responsive grid, dynamic badges, and interactive modals.

### 🐳 DevOps & Containerization
- **Docker**: Multi-stage `Dockerfile` with non-root security compliance.
- **Docker Compose**: Orchestrates `Node.js API` + `PostgreSQL 16` + `Redis 7` with health checks.

---

## 📋 Prerequisites

Make sure you have installed:
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- *(Optional)* **Docker & Docker Compose** (only if running the containerized PostgreSQL stack)

---

## 🚀 Full Setup & How to Run

### Step 1: Clone the Repository & Install Dependencies

```bash
# 1. Clone repository
git clone https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>.git
cd HealthcareManagement

# 2. Install root backend dependencies
npm install

# 3. Install frontend dependencies
cd frontend && npm install && cd ..
```

---

### Step 2: Environment Configuration

Copy the sample environment file (the default values are pre-configured for instant local running):

```bash
cp .env.example .env
```

Your `.env` contains:
```env
NODE_ENV=development
PORT=4000
DATABASE_URL="file:./eve_healthcare.db"
JWT_SECRET="eve-healthcare-jwt-secret-key-super-secure"
JWT_EXPIRES_IN="24h"
WEBHOOK_SECRET="eve-payment-webhook-secret-key"
```

---

### Step 3: Initialize Database & Seed Demo Data

Run the database sync and seed script. This automatically creates all tables and populates realistic demo centres, diagnostic tests, pricing, and users:

```bash
# Push Prisma schema to local SQLite database
npm run prisma:push

# Seed demo diagnostic centres, tests, and user accounts
npm run seed
```

---

### Step 4: Start the Applications

#### Option A: Run Locally (Recommended)

Open two terminal tabs:

**Terminal 1 — Backend API Server:**
```bash
npm run dev
```
- **Backend API**: [http://localhost:4000/api/v1](http://localhost:4000/api/v1)
- **Interactive Swagger Docs**: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)
- **Health Check**: [http://localhost:4000/health](http://localhost:4000/health)

**Terminal 2 — Frontend React App:**
```bash
cd frontend
npm run dev
```
- **Frontend URL**: [http://localhost:5173](http://localhost:5173)

---

#### Option B: Run with Docker Compose (PostgreSQL 16 + Redis 7 + API)

If you prefer to run the complete containerized stack with **PostgreSQL**:

```bash
# Build and spin up the complete multi-container stack in the background
docker compose up --build -d

# View live container logs
docker compose logs -f app

# Stop containers
docker compose down
```

---

### 🐘 How to Switch Between SQLite and PostgreSQL

The codebase includes automated switch scripts so you can work locally with SQLite and deploy with PostgreSQL:

```bash
# Switch schema provider to PostgreSQL:
npm run db:use:postgres

# In .env, set your PostgreSQL connection:
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/eve_healthcare?schema=public"

# Deploy migration to PostgreSQL:
npm run prisma:migrate:deploy
npm run seed

# Switch back to SQLite anytime:
npm run db:use:sqlite
```

---

## 🧪 How to Run Automated Tests

The test suite runs 30 end-to-end integration and concurrency tests:

```bash
# Run all test suites
npm test

# Run a specific test suite (e.g. Webhook Idempotency & Concurrency)
npm test tests/webhook_idempotency.test.ts
```

**Test Coverage Highlights:**
- ✅ **Authentication**: Signup, login, invalid credentials, JWT parsing, RBAC.
- ✅ **Centres & Tests**: Filter by city, search, admin-only centre creation, pricing association.
- ✅ **Bookings**: Future date validation, server-authoritative price check, IDOR ownership isolation, cancellation conflict checks.
- ✅ **Simulated Payments**: Confirmed status reconciliation, duplicate payment prevention.
- ✅ **Webhook Idempotency**: Repeated delivery safe ingestion, `Promise.all` concurrent race condition resilience, amount mismatch guards, HMAC-SHA256 signature verification.

---

## 🔑 Pre-seeded Demo Credentials

Use these accounts to test authenticated endpoints or log into the frontend:

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Admin** | `admin@evehealthcare.com` | `Admin@123456` | Create centres, manage tests & pricing, inspect all bookings |
| **Patient 1** | `john.doe@example.com` | `Patient@123456` | Book tests, view/cancel own bookings, process simulated payments |
| **Patient 2** | `sarah.smith@example.com` | `Patient@123456` | Independent patient account for IDOR authorization testing |

---

## 🌐 API Overview & Quick Curl Examples

### 1. Authentication
- `POST /api/v1/auth/signup` — Register as patient (`email`, `password`, `fullName`, `phone`).
- `POST /api/v1/auth/login` — Authenticate and receive JWT Bearer token.
- `GET /api/v1/auth/me` — Retrieve authenticated user profile.

```bash
# Login Example
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "john.doe@example.com", "password": "Patient@123456"}'
```

### 2. Centres & Tests
- `GET /api/v1/centres?city=New York&page=1&limit=20` — Browse centres with available tests and prices.
- `GET /api/v1/centres/:id` — View specific centre details.
- `POST /api/v1/centres` — Create a new centre *(Admin only)*.
- `POST /api/v1/centres/:id/tests` — Add/update test pricing for a centre *(Admin only)*.
- `GET /api/v1/tests` — Browse all diagnostic tests in the master catalog.

### 3. Bookings
- `POST /api/v1/bookings` — Book an appointment (`centreId`, `testId`, `appointmentTime`). Price is calculated server-side.
- `GET /api/v1/bookings?page=1&limit=20` — List bookings for current patient (or all for Admin).
- `GET /api/v1/bookings/:id` — View booking details (protected by user ownership).
- `POST /api/v1/bookings/:id/cancel` — Cancel a `PENDING` booking.

### 4. Simulated Payments
- `POST /payments/` *(or `/api/v1/payments/`)* — Simulate card/UPI payment (`bookingId`, `paymentMethod`, `simulateStatus: "SUCCESS" | "FAILED"`).

```bash
curl -X POST http://localhost:4000/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <PATIENT_JWT_TOKEN>" \
  -d '{
    "bookingId": "<BOOKING_UUID>",
    "paymentMethod": "UPI",
    "simulateStatus": "SUCCESS"
  }'
```

### 5. Idempotent Payment Webhook
- `POST /payments/webhook/` *(or `/api/v1/payments/webhook/`)* — Ingest payment provider event updates.
- If called repeatedly with the same `eventId`, it safely returns `already_processed` without creating duplicate payments or corrupting the booking state.

```bash
curl -X POST http://localhost:4000/payments/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: <OPTIONAL_HMAC_SHA256>" \
  -d '{
    "eventId": "evt_live_test_001",
    "eventType": "payment.succeeded",
    "bookingId": "<BOOKING_UUID>",
    "transactionId": "TXN_GATEWAY_101",
    "amount": 45.0
  }'
```

---

## 🏛️ Project Directory Structure

```text
HealthcareManagement/
├── .env.example             # Template for environment variables
├── .gitignore               # Comprehensive Git ignore rules
├── Dockerfile               # Production multi-stage Docker build
├── docker-compose.yml       # Multi-container orchestration (App, Postgres, Redis)
├── package.json             # Root dependencies & convenience scripts
├── tsconfig.json            # Strict TypeScript configuration
├── jest.config.js           # Jest test runner setup
├── README.md                # Project documentation & setup guide
├── prisma/
│   ├── schema.prisma        # Active Prisma schema
│   ├── schema.postgresql.prisma # PostgreSQL production schema
│   ├── schema.sqlite.prisma # SQLite zero-setup schema
│   └── migrations/          # SQL migrations for PostgreSQL
├── src/
│   ├── server.ts            # HTTP server entrypoint & graceful shutdown
│   ├── app.ts               # Express application initialization & middleware stack
│   ├── config/              # Fail-fast Zod-validated environment config
│   ├── controllers/         # HTTP request/response handlers
│   ├── db/                  # Prisma Client singleton
│   ├── docs/                # OpenAPI / Swagger specifications
│   ├── errors/              # Domain-specific AppError hierarchy
│   ├── middlewares/         # Auth, Zod validation, ErrorHandler, RequestID
│   ├── routes/              # Semantic API versioned routes
│   ├── schemas/             # Zod input validation schemas
│   ├── services/            # Business domain logic, transactions, state machine
│   ├── types/               # TypeScript interfaces & utility types
│   ├── utils/               # Structured logger & security/crypto helpers
│   └── scripts/
│       └── seed.ts          # Database seeder with realistic demo data
├── tests/                   # 30 automated integration & concurrency tests
└── frontend/                # Full React + Vite Single Page Application
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── App.jsx          # Main application shell with tab navigation
        ├── api.js           # Centralized API client
        └── components/      # UI components (Catalog, Booking, MyBookings, WebhookLab)
```
