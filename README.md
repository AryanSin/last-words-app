# Last Words

An automated dead man's switch, cryptographic vault, and scheduled message delivery platform. Messages and sensitive instructions are securely encrypted at rest (AES-256-GCM) and automatically dispatched to designated recipients via Email and WhatsApp when a user's inactivity threshold is reached.

---

## Features

- **Dead Man's Switch Inactivity Detection**: Background cron monitors evaluate user heartbeats against customizable inactivity thresholds (e.g. 30, 90, 365 days).
- **Biometric Heartbeat & Check-In**: Mobile app integrates biometric hardware authentication (Face ID, Touch ID, Fingerprint via `expo-local-authentication`) with an interactive pulsing heartbeat button (`LifePulseButton`) to reset the timer effortlessly.
- **Radial Countdown & Urgency Visualizer**: Dashboard displays an SVG radial countdown (`RadialCountdown`) indicating days remaining until the nearest scheduled dispatch, alerting users if they enter critical limit territory ($\le 7$ days).
- **Zero-Knowledge Encrypted Vault**: All stored message titles and message contents are encrypted at rest using authenticated **AES-256-GCM** with random initialization vectors (IV) and authentication tags.
- **Multi-Channel Dispatch Engine**: Automated delivery via **Email** (Nodemailer with SMTP or Ethereal test accounts) and **WhatsApp** (Twilio, Meta WhatsApp Cloud API, or local dev mock).
- **Resilient Distributed Queues**: Built on **BullMQ** and **Redis** with concurrency controls, automatic exponential backoff retries, and comprehensive delivery audit logs (`DeliveryEvent`, `JobExecution`).
- **Platform-Aware Authentication**: 
  - Email & Password (bcrypt hashed)
  - Google OAuth ID token verification
  - WhatsApp passwordless OTP with Redis TTL expiration
  - Platform-aware JWT lifetimes (extended sliding-window sessions for mobile, automatic silent background refresh, and seamless session expiration handling)
- **Push Reminders**: Native push alerts via Expo Notifications warning users of impending triggers or prompting periodic check-ins.
- **Redis Sliding-Window Rate Limiting**: Tiered distributed rate limiters protecting authentication, vault access, and public endpoints.

---

## Monorepo Architecture

The repository is organized as a **pnpm monorepo** with shared validation schemas and types:

```
last-words-app/
├── apps/
│   ├── server/                  # Node.js + Express REST API, BullMQ worker, cron scheduler
│   │   ├── prisma/              # Prisma schema & database migrations (PostgreSQL)
│   │   └── src/
│   │       ├── config/          # Environment variables, Redis, Prisma, Swagger
│   │       ├── controllers/     # Route controllers (Auth, Users, Messages, Jobs, Metrics)
│   │       ├── integrations/    # Email (Nodemailer), WhatsApp (Twilio/Meta), Google Auth
│   │       ├── jobs/            # Scheduled cron jobs (Message triggers, Push reminders)
│   │       ├── middleware/      # Rate limiters, JWT auth, Zod validation
│   │       ├── queues/          # BullMQ queue definitions
│   │       ├── scripts/         # End-to-end verification and biometric test scripts
│   │       ├── services/        # Business logic, OTP, crypto engine (AES-256-GCM)
│   │       ├── utils/           # Structured logging (Pino), tokens, pagination
│   │       └── workers/         # BullMQ async delivery worker
│   └── mobile/                  # React Native mobile app (Expo SDK 58, React Native 0.88, React 19)
│       ├── app/                 # File-based routes ((auth), (tabs), messages/[id])
│       ├── components/          # UI components (LifePulseButton, RadialCountdown, VaultMessageCard)
│       ├── constants/           # Deep Midnight Obsidian & Radiant Cyan design system
│       ├── hooks/               # Custom TanStack React Query hooks, theme color hooks
│       ├── services/            # Biometric service (LocalAuthentication), API client
│       └── store/               # Zustand authentication & state management
├── packages/
│   └── shared/                  # @shared package: Zod schemas & TypeScript types
├── docker/                      # Dockerfiles (Dockerfile.server)
├── k8s/                         # Kubernetes manifests (StatefulSet, Deployments, Services)
└── docker-compose.yml           # Multi-container orchestration (PostgreSQL 15, Redis 7, API)
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

*(Optional: To run the backend inside Docker as well, run `docker compose up -d`)*

### 3. Environment Variables Configuration

#### Backend Configuration (`apps/server/.env`):

```env
# Database & Network
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/last_words?schema=public"
PORT=3000
NODE_ENV="development"

# Security & Tokens
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
CRYPTO_MASTER_KEY="your-32-byte-hex-encoded-aes-encryption-key" # 64 hex characters

# Redis & BullMQ
REDIS_HOST="localhost"
REDIS_PORT=6379

# Email Service (Nodemailer)
# Leave blank to automatically use an Ethereal virtual mailbox in development
SMTP_HOST=""
SMTP_PORT=587
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="Last Words <noreply@lastwords.app>"

# WhatsApp Gateway ("dev" | "twilio" | "meta")
WHATSAPP_PROVIDER="dev"

# Twilio (Optional - Required if WHATSAPP_PROVIDER="twilio")
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_WHATSAPP_NUMBER=""

# Meta WhatsApp Cloud API (Optional - Required if WHATSAPP_PROVIDER="meta")
META_WHATSAPP_TOKEN=""
META_PHONE_NUMBER_ID=""

# Google OAuth 2.0 (Optional)
GOOGLE_CLIENT_ID=""
```

#### Mobile App Configuration (`apps/mobile/.env`):

```env
EXPO_PUBLIC_API_URL="http://localhost:3000"
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

You can start the server and mobile apps using root pnpm scripts:

```bash
# Start backend API server with auto-reload (port 3000)
pnpm dev:server

# Start Expo mobile bundler (press 'a' for Android, 'i' for iOS simulator, or 'w' for Web)
pnpm dev:mobile
```

---

## NPM Scripts Reference

From the monorepo root:

| Command | Action |
| :--- | :--- |
| `pnpm dev:server` | Start backend server in development mode (`ts-node-dev`) |
| `pnpm dev:mobile` | Launch Expo React Native development server |
| `pnpm typecheck` | Run TypeScript type checks across all workspaces (`server`, `mobile`, `shared`) |
| `pnpm build` | Compile backend TypeScript to production JavaScript |
| `pnpm test` | Run Vitest unit & integration test suites |

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
| **Auth** | `POST /auth/register` | Register new user with email and password |
| **Auth** | `POST /auth/login` | Authenticate with email and password |
| **Auth** | `POST /auth/google` | Sign in / register via Google ID token |
| **Auth** | `POST /auth/whatsapp/send-otp` | Request a 6-digit WhatsApp OTP |
| **Auth** | `POST /auth/whatsapp/verify-otp` | Verify OTP and authenticate |
| **Auth** | `POST /auth/refresh` | Rotate and issue fresh token pair (platform-aware) |
| **Auth** | `POST /auth/logout` | Revoke active refresh token from Redis |
| **Users** | `POST /users/check-in` | Send heartbeat / reset inactivity timer (supports `{ biometricVerified: true, authMethod: "BIOMETRIC" }`) |
| **Users** | `POST /users/verify-password` | Verify account password for sensitive actions (e.g. disabling biometric pulse check-in) |
| **Users** | `GET /users/me` | Fetch authenticated user profile and defaults |
| **Users** | `PATCH /users/me` | Update user profile details |
| **Users** | `PATCH /users/trigger-days` | Update user-level default inactivity threshold |
| **Users** | `GET /users/switch-status` | Get countdown status to nearest message trigger and encryption metadata |
| **Users** | `POST /users/push-token` | Register Expo push notification token |
| **Users** | `DELETE /users/push-token` | Unregister Expo push notification token |
| **Messages** | `GET /messages` | Retrieve user's vault messages sorted by urgency |
| **Messages** | `GET /messages/:id` | View specific message details (decrypted) |
| **Messages** | `POST /messages` | Create and encrypt a new vault message |
| **Messages** | `PATCH /messages/:id` | Update an existing pending message |
| **Messages** | `DELETE /messages/:id` | Soft-delete / remove message from vault |
| **Jobs** | `POST /jobs/trigger-message` | Manually trigger inactivity evaluation & queue dispatch |
| **Jobs** | `POST /jobs/trigger-reminders` | Manually trigger push reminder check |
| **Metrics** | `GET /metrics` | Retrieve delivery metrics (sent vs. failed counts) |

---

## Security & Architecture Highlights

1. **Payload Encryption at Rest**: Sensitive message titles and message contents are encrypted using **AES-256-GCM** with a 256-bit secret key, unique 96-bit initialization vectors (IVs) per item, and 128-bit authentication tags.
2. **Biometric Validation**: Mobile check-ins utilize secure hardware enclaves (Face ID / Touch ID / Android BiometricPrompt) to guarantee authentic user presence before firing heartbeat resets.
3. **Session Hardening**: Mobile clients receive prolonged sliding refresh tokens that automatically refresh silently in the background, while web clients use stricter short-lived sessions. Revoked tokens are immediately wiped from Redis sets.
4. **Resilient Message Dispatch**: Inactivity detection queues jobs into BullMQ with exponential backoff retries. If delivery channels fail up to 3 times, messages transition to `FAILED` status and log detailed error telemetry in `DeliveryEvent`.
5. **Biometric Settings Protection**: Disabling biometric pulse check-in requires re-authentication via Face ID / Touch ID or account password verification (`POST /users/verify-password`), preventing unauthorized tampering on unlocked devices.
