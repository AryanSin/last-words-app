# Last Words

An automated dead man's switch, cryptographic vault, and scheduled message delivery platform. Messages and sensitive instructions are securely encrypted at rest (AES-256-GCM) and automatically dispatched to designated recipients via Email when a user's inactivity threshold is reached.

## Live App & Downloads

- **Web App:** [last-words-app-three.vercel.app](http://last-words-app-three.vercel.app/)
- **Android APK (v1.0.0):** [Download `last-words-v1.0.0.apk`](https://github.com/AryanSin/last-words-app/releases/download/v1.0.0-new/last-words-v1.0.0.apk) · [View Releases](https://github.com/AryanSin/last-words-app/releases)

---

## Features

- **Dead Man's Switch Inactivity Detection**: Background cron monitors evaluate user heartbeats against customizable inactivity thresholds (e.g. 30, 60, 90, 180, 365 days; up to 3,650 days).
- **Biometric Heartbeat & Check-In**: Mobile app integrates biometric hardware authentication (Face ID, Touch ID, Fingerprint via `expo-local-authentication`) with an interactive pulsing heartbeat button (`LifePulseButton`) to reset the timer effortlessly.
- **Radial Countdown & Inactivity Safety Net**: Dashboard displays an SVG radial countdown (`RadialCountdown`) indicating days remaining until the nearest scheduled dispatch, alerting users in critical territory ($\le 7$ days), paired with a 3-stage Inactivity Safety Net timeline (14-day advance reminder, 7-day urgent warning, 24-hour grace period).
- **Zero-Knowledge Encrypted Vault**: All stored message titles and message contents are encrypted at rest using authenticated **AES-256-GCM** with random initialization vectors (IV) and authentication tags.
- **Automated Email Dispatch Engine**: Reliable delivery via **Email** (Nodemailer with SMTP or automatic Ethereal virtual test accounts in development).
- **Vault Search, Filtering & Guidance**: Mobile vault supports instant search across titles, recipients, and content, segmented status filters (`ALL`, `ARMED`, `DISPATCHED`), live autonomous dispatch previews during authoring/editing, and an in-app `VaultGuideModal` FAQ.
- **Resilient Distributed Queues**: Built on **BullMQ** and **Redis** with concurrency controls, automatic exponential backoff retries, and comprehensive delivery audit logs (`DeliveryEvent`, `JobExecution`).
- **Platform-Aware Authentication**:
  - Email & Password (`bcrypt` hashed)
  - Google OAuth ID token verification (multi-client support for Web, Android, and iOS with `userinfo`/`tokeninfo` fallbacks)
  - Platform-aware JWT lifetimes (extended sliding-window sessions for mobile, automatic silent background refresh, and explicit Redis access-token revocation on logout)
- **Push Reminders**: Native push alerts via Expo Notifications warning users of impending triggers or prompting periodic check-ins.
- **Redis Sliding-Window Rate Limiting**: Tiered distributed rate limiters protecting authentication, vault access, jobs, metrics, and public endpoints.

---

## Monorepo Architecture

The repository is organized as a **pnpm monorepo** (`pnpm-workspace.yaml`) with shared validation schemas and types:

```
last-words-app/
├── apps/
│   ├── server/                  # Node.js + Express REST API, BullMQ worker, cron scheduler
│   │   ├── prisma/              # Prisma schema & database migrations (PostgreSQL)
│   │   └── src/
│   │       ├── server.ts        # HTTP API entrypoint (Express REST API, port 3000)
│   │       ├── worker.ts        # Dedicated Background Worker entrypoint (BullMQ, Crons)
│   │       ├── app.ts           # Express app wiring, middleware & route mounting
│   │       ├── config/          # Environment variables, Redis (URL/TLS + host), Prisma
│   │       ├── controllers/     # Route controllers (Auth, Users, Messages, Metrics)
│   │       ├── docs/            # OpenAPI / Swagger specification & UI (/docs)
│   │       ├── integrations/    # Email (Nodemailer), Google OAuth (multi-client verification)
│   │       ├── jobs/            # Scheduled cron jobs (Hourly trigger check, Daily push reminders)
│   │       ├── middleware/      # Rate limiters, JWT & Redis revocation auth, Zod validation
│   │       ├── queues/          # BullMQ queue definitions ('message-delivery')
│   │       ├── scripts/         # End-to-end verification, metric seeding & biometric test scripts
│   │       ├── services/        # Business logic, crypto engine (AES-256-GCM), push reminders
│   │       ├── templates/       # Transactional & vault email HTML templates
│   │       ├── utils/           # Structured logging (Pino), tokens, pagination
│   │       └── workers/         # BullMQ async delivery worker
│   └── mobile/                  # React Native mobile app (Expo SDK 58, React Native 0.88, React 19.3)
│       ├── app/                 # File-based routes ((auth)/login, (tabs), messages/[id], messages/[id]/edit, messages/create)
│       ├── components/          # UI components (LifePulseButton, RadialCountdown, VaultMessageCard, VaultGuideModal, SecurityAuthModal, ConfirmModal, GoogleIcon)
│       ├── constants/           # Midnight Obsidian Vault design system tokens (theme.ts)
│       ├── hooks/               # Custom TanStack React Query hooks, theme color hooks
│       ├── services/            # Biometric service, API client, Push notifications, Token storage
│       ├── store/               # Zustand authentication & session state management
│       └── eas.json             # Expo Application Services (EAS) build & submit profiles
├── packages/
│   └── shared/                  # @lastwords/shared package: Zod schemas & TypeScript types
├── docker/                      # Dockerfiles (Dockerfile.server)
├── k8s/                         # Kubernetes manifests (StatefulSet, Deployments, Services)
├── DESIGN.md                    # Midnight Obsidian Vault UI/UX design system specification
├── PRODUCT.md                   # Product positioning, capabilities & brand commitments
├── pnpm-workspace.yaml          # pnpm monorepo workspace configuration
└── docker-compose.yml           # Multi-container orchestration (PostgreSQL 15, Redis 7, API, Worker)
```

---

## Prerequisites

- **Node.js**: `20.x` or higher
- **pnpm**: `9.x` or higher (`npm install -g pnpm`)
- **Docker & Docker Compose**: For running PostgreSQL, Redis, and containerized services

---

## Quick Start

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/AryanSin/last-words-app.git
cd last-words-app
pnpm install
```

### 2. Start Infrastructure Services

Spin up PostgreSQL 15 and Redis 7 (with health checks configured):

```bash
docker compose up -d postgres redis
```

> **Note**: In `docker-compose.yml`, PostgreSQL is mapped to host port **`5433`** (`5433:5432`) while internal container-to-container traffic uses `postgres:5432`.

*(Optional: To run the backend inside Docker as well, run `docker compose up -d`)*

### 3. Environment Variables Configuration

#### Backend Configuration (`apps/server/.env`):

```env
# Server
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug

# PostgreSQL Database Connection
# Use port 5433 when connecting from host to Docker Compose Postgres (or 5432 for local native Postgres)
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/last_words?schema=public"

# Redis Connection (Rate Limiting, Refresh Tokens, Revoked Tokens, BullMQ Queues)
# Use either REDIS_URL (e.g. Upstash / Render: "rediss://default:password@host:port") OR REDIS_HOST + REDIS_PORT
REDIS_URL=""
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=""

# Security & Encryption
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
MESSAGE_ENCRYPTION_SECRET="your-32-byte-aes-encryption-secret"

# Email Service (Nodemailer)
# Leave blank to automatically use an Ethereal virtual mailbox in development
SMTP_HOST=""
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="Last Words <noreply@lastwords.app>"

# Google OAuth 2.0 (Optional in dev)
GOOGLE_CLIENT_ID=""
GOOGLE_WEB_CLIENT_ID=""
GOOGLE_ANDROID_CLIENT_ID=""
GOOGLE_IOS_CLIENT_ID=""
```

#### Mobile App Configuration (`apps/mobile/.env`):

```env
# Expo Public API URL
# - iOS Simulator / Web: http://localhost:3000
# - Android Emulator: http://10.0.2.2:3000
# - Physical Mobile Device on same Wi-Fi: http://<YOUR_PC_IP>:3000
EXPO_PUBLIC_API_URL=http://localhost:3000

# Google OAuth Client IDs (Expo Public)
EXPO_PUBLIC_GOOGLE_CLIENT_ID=""
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=""
# Native Mobile Client IDs (required for standalone/dev-client Android & iOS builds)
# EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=""
# EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=""
```

> **Note for Physical Devices**: Replace `localhost` with your machine's LAN IP address (e.g. `http://192.168.1.50:3000`) so mobile devices can reach the local API server.

### 4. Database Setup & Migrations

```bash
cd apps/server
pnpm exec prisma db push
pnpm exec prisma generate
cd ../..
```

### 5. Running the Application

You can start the server, background worker, and mobile apps using root pnpm scripts:

```bash
# 1. Start the HTTP API server with auto-reload (port 3000)
pnpm dev:server

# 2. Start the Dedicated Background Worker & Cron Scheduler
pnpm dev:worker

# 3. Start the Expo mobile bundler (press 'a' for Android, 'i' for iOS simulator, or 'w' for Web)
pnpm dev:mobile
```

> **Running via Docker Compose**:
> ```bash
> # Starts PostgreSQL, Redis, the API server, and the dedicated worker container
> docker compose up -d postgres redis api worker
> ```

---

## NPM Scripts Reference

From the monorepo root:

| Command | Action |
| :--- | :--- |
| `pnpm dev:server` | Start backend REST API in development mode (`ts-node-dev src/server.ts`, port 3000) |
| `pnpm dev:worker` | Start dedicated background worker & cron scheduler (`ts-node-dev src/worker.ts`) |
| `pnpm dev:mobile` | Launch Expo React Native development server |
| `pnpm typecheck` | Run TypeScript type checks across all workspaces (`server`, `mobile`, `shared`) |
| `pnpm build` | Compile backend TypeScript to production JavaScript |
| `pnpm test` | Run Vitest unit & integration test suites |
| `pnpm lint` | Run ESLint across workspaces |

---

## Verification & Test Scripts

The backend includes test scripts to verify services end-to-end against local containers:

```bash
# Verify entire backend lifecycle (registration, JWT, rate limiting, encryption, scheduling)
pnpm --filter server exec ts-node -r tsconfig-paths/register src/scripts/testBackend.ts

# Verify Biometric Check-In API payload & heartbeat audit logging
pnpm --filter server exec ts-node -r tsconfig-paths/register src/scripts/testBiometricCheckin.ts

# Test sliding-window Redis rate limiters
pnpm --filter server exec ts-node -r tsconfig-paths/register src/scripts/testRateLimiters.ts

# Test push reminder generation logic
pnpm --filter server exec ts-node -r tsconfig-paths/register src/scripts/testPushReminders.ts

# Test message urgency sorting
pnpm --filter server exec ts-node -r tsconfig-paths/register src/scripts/testUrgencySorting.ts

# Test switch status countdown calculations
pnpm --filter server exec ts-node -r tsconfig-paths/register src/scripts/testSwitchStatus.ts
```

---

## API Documentation

Interactive OpenAPI / Swagger documentation is available at:
```
http://localhost:3000/docs
```

### Primary Endpoints

| Category | Method & Endpoint | Description |
| :--- | :--- | :--- |
| **System** | `GET /health` | Service health and uptime check |
| **Auth** | `POST /auth/register` | Register new user with email and password |
| **Auth** | `POST /auth/login` | Authenticate with email and password |
| **Auth** | `POST /auth/google` | Sign in / register via Google OAuth token |
| **Auth** | `POST /auth/refresh` | Rotate and issue fresh token pair (platform-aware) |
| **Auth** | `POST /auth/logout` | Revoke active refresh token and blacklist access token in Redis |
| **Auth** | `POST /auth/check-in` | Authenticated heartbeat check-in via auth router |
| **Users** | `POST /users/check-in` | Send heartbeat / reset inactivity timer (supports `{ biometricVerified: true, authMethod: "BIOMETRIC" }`) |
| **Users** | `POST /users/verify-password` | Verify account password for sensitive actions (e.g. disabling biometric pulse check-in) |
| **Users** | `GET /users/me` | Fetch authenticated user profile and defaults |
| **Users** | `PATCH /users/me` | Update user profile details |
| **Users** | `PATCH /users/:id/default-trigger` | Update user-level default inactivity threshold |
| **Users** | `GET /users/switch-status` | Get countdown status to nearest message trigger and encryption metadata (`GET /users/me/switch-status` alias) |
| **Users** | `POST /users/push-token` | Register Expo push notification token |
| **Users** | `DELETE /users/push-token` | Unregister Expo push notification token |
| **Messages** | `GET /messages` | Retrieve vault messages (and `GET /messages/me` sorted by urgency) |
| **Messages** | `GET /messages/:id` | View specific message details (decrypted) |
| **Messages** | `POST /messages` | Create and encrypt a new vault message |
| **Messages** | `PATCH /messages/:id` | Update an existing pending message |
| **Messages** | `DELETE /messages/:id` | Remove message from vault |
| **Messages** | `POST /messages/test` | Trigger test email delivery (`POST /messages/test-send` alias) & inspect queue (`GET /messages/test/queue`) |
| **Jobs** | `POST /jobs/trigger-message` | Manually trigger inactivity evaluation & queue dispatch |
| **Jobs** | `POST /jobs/trigger-reminders` | Manually trigger push reminder check |
| **Metrics** | `GET /metrics/messages` | Retrieve delivery metrics (sent vs. failed counts) |

---

## Security & Architecture Highlights

1. **Payload Encryption at Rest**: Sensitive message titles and message contents are encrypted using **AES-256-GCM** with `MESSAGE_ENCRYPTION_SECRET`, unique 96-bit initialization vectors (IVs) per item, and 128-bit authentication tags.
2. **Biometric Validation**: Mobile check-ins utilize secure hardware enclaves (Face ID / Touch ID / Android BiometricPrompt) to guarantee authentic user presence before firing heartbeat resets.
3. **Session Hardening**: Mobile clients receive prolonged sliding refresh tokens that automatically refresh silently in the background, while web clients use stricter short-lived sessions. On logout, refresh tokens are wiped and active access tokens are explicitly blacklisted in Redis (`revoked_token:<token>`) until expiration.
4. **Resilient Message Dispatch**: Hourly inactivity detection (`MESSAGE_TRIGGER_CRON`, default `0 * * * *`) queues jobs into BullMQ with exponential backoff retries. If email delivery fails up to 3 times, messages transition to `FAILED` status and log detailed error telemetry in `DeliveryEvent`.
5. **Biometric Settings Protection**: Disabling biometric pulse check-in requires re-authentication via Face ID / Touch ID or account password verification (`POST /users/verify-password`), preventing unauthorized tampering on unlocked devices.
6. **Decoupled 12-Factor Worker Architecture**: The HTTP API server (`src/server.ts`) and background processing engine (`src/worker.ts`) run as isolated OS processes communicating asynchronously through Redis distributed queues (`bull:message-delivery:*`) and PostgreSQL. This guarantees that heavy email dispatches or reminder bursts never block the API event loop or introduce latency into mobile user sessions.
