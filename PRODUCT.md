# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

Personal contingency & estate planners: Individuals preparing critical emergency instructions, credentials, medical wishes, or personal farewell messages for loved ones in case of unforeseen incapacitation or death.

## Product Purpose

Provide an automated, cryptographically secured dead man's switch and digital message vault. Users deposit sensitive documents, credentials, or personal farewells and maintain an active heartbeat. If inactivity exceeds a configured threshold, the system autonomously decrypts and dispatches the messages to designated recipients via Email and WhatsApp.

## Positioning

Unlike passive password managers or static legal wills that require probate and physical discovery, Last Words acts as an active, automated dead man's switch. It combines zero-knowledge client-side awareness, AES-256-GCM authenticated encryption at rest, and multi-channel proactive dispatch without requiring third-party court orders to trigger.

## Operating Context

- Mobile-first daily/weekly check-in rituals (Face ID / Fingerprint pulse tap via `LifePulseButton`).
- Inactivity countdown visibility (radial urgency gauge indicating days remaining).
- Secure authoring of sensitive messages with custom delivery thresholds and recipient contacts.
- High emotional stakes and trust requirements: false positives (firing early) and false negatives (failing to deliver) are both unacceptable.

## Capabilities and Constraints

- **Capabilities**:
  - Encrypted vault storage with AES-256-GCM.
  - Biometric authentication (`expo-local-authentication` for Face ID, Touch ID, Fingerprint).
  - Multi-channel delivery: Email (Nodemailer) and WhatsApp (Meta Cloud API / Twilio).
  - Sliding-window mobile sessions with automatic background token refresh (users remain logged in across long intervals).
  - Resilient distributed queues (BullMQ over Redis) with exponential backoff retries.
  - Push reminders via Expo Notifications alerting users before thresholds expire.
- **Constraints**:
  - Single source of truth for message delivery state is PostgreSQL.
  - Strict audit logging for delivery events and biometric check-ins.
  - Rate-limited authentication and API endpoints.

## Brand Commitments

- **Name**: Last Words (strict; never "Vault").
- **Voice**: Solemn, calm, reassuring, highly reliable, respectful of sensitive mortality/contingency subject matter.
- **Visual Foundation**: Deep Midnight Obsidian background with Radiant Cyan / Emerald Pulse accents to evoke security, life, and quiet vitality rather than morbid fear.

## Evidence on Hand

- Complete working mobile application in `apps/mobile/` (React Native 0.81, Expo SDK 55).
- Working backend in `apps/server/` (Express, BullMQ, Redis, PostgreSQL 15 via Prisma).
- Reusable UI components: `LifePulseButton`, `RadialCountdown`, `VaultMessageCard`.
- End-to-end verified delivery pipeline and biometric check-in endpoints.

## Product Principles

1. **Never Fire in Error**: Inactivity thresholds must prioritize user intent with warnings and grace periods before any message dispatch.
2. **Effortless Proof of Life**: Checking in must take less than two seconds via a single biometric pulse tap without requiring full password re-entry.
3. **Cryptographic Integrity & Privacy**: Content is strictly encrypted at rest with authenticated AES-256-GCM; unencrypted data is never leaked.
4. **Resilient Decoupled Delivery**: Core API operations and background dispatches are isolated so failures in external delivery gateways never degrade the user experience.

## Accessibility & Inclusion

- High contrast readable text against obsidian backgrounds.
- Explicit text labels accompanying all iconography and urgency indicators.
- Non-visual feedback (haptic vibration pulses) on check-in and confirmation actions.
