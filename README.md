# Last Words

An automated dead man's switch and scheduled message delivery platform. Messages and important notes are scheduled to be sent to designated recipients via Email and WhatsApp when a user's inactivity threshold is reached.

## Features

- **Inactivity Detection**: Automatic trigger checks evaluate user check-ins and dispatch pending messages once the inactivity threshold (e.g. 30 days, 365 days) is exceeded.
- **Multi-Channel Dispatch**: Automated delivery via Email (Nodemailer) and WhatsApp (Twilio, Meta Cloud API, or local dev mock).
- **Authentication**: Email & Password, Google OAuth ID Token, and WhatsApp OTP verification.
- **Push Reminders**: Mobile push notification alerts for impending triggers and periodic heartbeat reminders.
- **Rate Limiting & Job Queueing**: Redis-backed sliding-window rate limiters and BullMQ asynchronous message processing.

## Repository Structure

```
last-words-app/
├── apps/
│   ├── server/          # Express.js REST API, cron scheduler, BullMQ worker
│   └── mobile/          # React Native (Expo Router) mobile app
├── packages/
│   └── shared/          # Shared Zod validation schemas and TypeScript DTOs
├── docker/              # Dockerfiles and container configurations
├── k8s/                 # Kubernetes deployment manifests
└── docker-compose.yml   # PostgreSQL 15 & Redis 7 services
```

## Prerequisites

- Node.js 20+
- pnpm 9+ (`npm install -g pnpm`)
- Docker & Docker Compose

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start Infrastructure

Start PostgreSQL and Redis containers:

```bash
docker compose up -d
```

### 3. Configure Environment Variables

Create `apps/server/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/last_words"
PORT=3000
JWT_SECRET="your_secret_jwt_key"
REDIS_HOST="localhost"
REDIS_PORT=6379

# WhatsApp ("dev" | "twilio" | "meta")
WHATSAPP_PROVIDER="dev"

# Twilio (optional)
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_WHATSAPP_NUMBER=""

# Meta WhatsApp Cloud API (optional)
META_WHATSAPP_TOKEN=""
META_PHONE_NUMBER_ID=""

# Google OAuth (optional)
GOOGLE_CLIENT_ID=""
```

Create `apps/mobile/.env`:

```env
EXPO_PUBLIC_API_URL="http://localhost:3000"
```

### 4. Database Setup

```bash
cd apps/server
pnpm exec prisma db push
pnpm exec prisma generate
```

### 5. Running the Apps

```bash
# Start backend API server (port 3000)
pnpm --filter server dev

# Start mobile app (Expo)
pnpm --filter mobile start
```

## Testing

Run unit and integration tests:

```bash
pnpm --filter server test
```

Run end-to-end backend verification script:

```bash
pnpm --filter server exec ts-node -r tsconfig-paths/register src/scripts/testBackend.ts
```

## API Overview

Interactive Swagger documentation is available at `http://localhost:3000/docs`.

### Key Endpoints

- `POST /auth/register` - Create account with email & password
- `POST /auth/login` - Authenticate with email & password
- `POST /auth/google` - Authenticate via Google ID token
- `POST /auth/whatsapp/send-otp` - Request WhatsApp OTP code
- `POST /auth/whatsapp/verify-otp` - Verify OTP and sign in
- `POST /users/check-in` - Heartbeat / reset inactivity timer
- `GET /users/me` - Fetch authenticated user profile
- `GET /users/switch-status` - Get countdown status to nearest message trigger
- `GET /messages` - List messages sorted by trigger urgency
- `POST /messages` - Create a scheduled message
- `PATCH /messages/:id` - Edit a scheduled message
- `DELETE /messages/:id` - Remove a message from vault
- `POST /jobs/trigger-message` - Execute manual message trigger check
- `POST /jobs/trigger-reminders` - Execute manual push reminder check
