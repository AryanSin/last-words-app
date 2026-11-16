# Last Words — System Architecture & ER Diagrams

This document provides a comprehensive technical overview of the **Last Words** platform, including its system topology, database Entity-Relationship (ER) model, Dead Man's Switch execution workflows, Biometric heartbeat check-in mechanics, and mobile client state architecture.

---

## 1. System Architecture Diagram

```mermaid
flowchart TD
    subgraph Clients["Clients Layer"]
        subgraph MobileApp["Expo React Native Mobile App (apps/mobile)"]
            UI["UI Views & Screens<br/>• Dashboard ((tabs)/index)<br/>• Vault ((tabs)/messages)<br/>• Settings ((tabs)/settings)<br/>• Auth ((auth)/login)"]
            BioComp["Biometric & Animation Components<br/>• LifePulseButton (Pulse Glow & Haptics)<br/>• RadialCountdown (SVG Progress)<br/>• VaultMessageCard (Urgency & Status)"]
            BioService["Biometric Service<br/>(expo-local-authentication: Face ID / Touch ID)"]
            Store["Zustand Auth Store (useAuthStore)<br/>• Silent Token Refresh<br/>• Automatic Session Expiry Interceptor"]
            Query["TanStack React Query<br/>(Cache & Data Synchronization)"]
        end
        WebClients["Web / API Clients<br/>• OpenAPI / Swagger UI (/docs)"]
    end

    subgraph Gateway["API Gateway & Middleware Layer (apps/server)"]
        ExpressApp["Express.js HTTP Server"]
        PlatformDetector["Platform Detector Middleware<br/>(X-Client-Platform: Mobile vs. Web)"]
        GlobalLimiter["Global Sliding Rate Limiter<br/>(Redis-backed)"]
        AuthMiddleware["JWT Authentication Middleware<br/>(Access & Refresh Tokens)"]
        RouteRateLimiter["Per-Route Sliding Rate Limiters<br/>(Auth, Users, Messages, Metrics)"]
        ValidationMiddleware["Zod Validation Layer<br/>(@shared package schemas)"]
    end

    subgraph Routes["REST API Routers"]
        AuthRouter["/auth<br/>• Register & Login (bcrypt)<br/>• Google OAuth (ID Token)<br/>• WhatsApp OTP (Redis TTL)<br/>• Platform-aware Token Refresh & Logout"]
        UserRouter["/users<br/>• User Profile & Default Triggers<br/>• Biometric Heartbeat Check-In<br/>• Switch Status & Countdown<br/>• Password Verification (/verify-password)<br/>• Push Token Registration"]
        MessageRouter["/messages<br/>• Encrypted Vault CRUD<br/>• Trigger Urgency Sorting<br/>• Message Status Tracking"]
        JobRouter["/jobs<br/>• Manual Message Trigger<br/>• Manual Push Reminder Check"]
        MetricRouter["/metrics<br/>• System Delivery Stats"]
    end

    subgraph BackgroundServices["Background Engines & Queues"]
        MessageCron["Message Trigger Cron<br/>(Runs every 15 min / configurable)"]
        ReminderCron["Push Reminder Cron<br/>(Scheduled Inactivity Warnings)"]
        TriggerService["MessageTriggerService<br/>(Threshold Inactivity Scanner)"]
        ReminderService["PushReminderService<br/>(7-day Warning & 5-day Heartbeat)"]
        BullQueue["BullMQ Queue ('message-delivery')<br/>(Redis-backed, Exponential Backoff)"]
        Worker["BullMQ Delivery Worker<br/>(Concurrency: 5, Channel Dispatcher)"]
        CryptoEngine["AES-256-GCM Vault Engine<br/>(Master Key + IV + Auth Tag)"]
    end

    subgraph DataStore["Data & Cache Layer"]
        PostgresDB[("PostgreSQL 15 Database<br/>Prisma ORM Client")]
        RedisDB[("Redis 7 In-Memory Store<br/>• Sliding-Window Rate Limits<br/>• BullMQ Job Queues<br/>• Refresh Tokens & OTP Caching")]
    end

    subgraph ExternalIntegrations["External Gateways"]
        EmailService["Email Gateway (Nodemailer)<br/>• SMTP Server or Ethereal Virtual Mailbox"]
        WhatsAppService["WhatsApp Gateway<br/>• Twilio / Meta Cloud API / Mock"]
        GoogleIdentity["Google Identity Services<br/>• OAuth 2.0 ID Token Verification"]
        ExpoPushService["Expo Push Notification Service<br/>• Mobile Inactivity Alerts"]
    end

    %% Client flows
    UI --> Store
    UI --> Query
    BioComp --> BioService
    BioComp --> Store
    Store --> ExpressApp
    Query --> ExpressApp
    WebClients --> ExpressApp

    %% Gateway pipeline
    ExpressApp --> PlatformDetector
    PlatformDetector --> GlobalLimiter
    GlobalLimiter --> AuthMiddleware
    AuthMiddleware --> RouteRateLimiter
    RouteRateLimiter --> ValidationMiddleware

    %% Routers
    ValidationMiddleware --> AuthRouter
    ValidationMiddleware --> UserRouter
    ValidationMiddleware --> MessageRouter
    ValidationMiddleware --> JobRouter
    ValidationMiddleware --> MetricRouter

    %% Routes interactions
    AuthRouter --> PostgresDB
    AuthRouter --> RedisDB
    AuthRouter --> GoogleIdentity
    AuthRouter --> WhatsAppService

    UserRouter --> PostgresDB
    UserRouter --> ExpoPushService
    
    MessageRouter --> PostgresDB
    MessageRouter --> CryptoEngine

    %% Background & Queues
    MessageCron --> TriggerService
    ReminderCron --> ReminderService

    TriggerService --> PostgresDB
    TriggerService --> BullQueue
    ReminderService --> PostgresDB
    ReminderService --> ExpoPushService

    BullQueue --> RedisDB
    RedisDB --> Worker
    Worker --> CryptoEngine
    Worker --> PostgresDB
    Worker --> EmailService
    Worker --> WhatsAppService
```

---

## 2. Database Entity-Relationship (ER) Diagram

The diagram below reflects the PostgreSQL schema managed via Prisma ORM (`apps/server/prisma/schema.prisma`).

```mermaid
erDiagram
    USER ||--o{ DEVICE_TOKEN : "registers"
    USER ||--o{ MESSAGE : "creates"
    MESSAGE ||--o{ DELIVERY_EVENT : "logs"

    USER {
        int id PK "autoincrement"
        string name "nullable"
        string email UK "nullable"
        string phoneNumber UK "nullable"
        string googleId UK "nullable"
        string password "nullable (bcrypt hash)"
        string avatarUrl "nullable"
        boolean isEmailVerified "default: false"
        boolean isPhoneVerified "default: false"
        AuthProvider_List authProviders "default: [LOCAL]"
        int defaultTriggerAfterDays "default: 365, nullable"
        boolean archived "default: false, nullable"
        datetime lastLoginAt "default: now()"
        datetime lastReminderSentAt "nullable"
        datetime createdAt "default: now()"
        datetime updatedAt "updatedAt"
    }

    DEVICE_TOKEN {
        int id PK "autoincrement"
        int userId FK "references User(id) ON DELETE CASCADE"
        string token UK "Expo push token"
        string platform "default: mobile (ios/android/web)"
        datetime createdAt "default: now()"
        datetime updatedAt "updatedAt"
    }

    MESSAGE {
        int id PK "autoincrement"
        int userId FK "references User(id) ON DELETE CASCADE"
        string title "nullable, AES-256-GCM ciphertext"
        string content "AES-256-GCM ciphertext with IV & AuthTag"
        string recipientName "nullable"
        string recipientEmail "nullable"
        string recipientPhone "nullable"
        DeliveryChannel deliveryChannel "default: EMAIL"
        int triggerAfterDays "custom override threshold, nullable"
        datetime sentAt "nullable, timestamp of successful dispatch"
        int failedAttempts "default: 0 (max: 3 retries)"
        string lastError "nullable, error diagnostic message"
        MessageStatus status "default: PENDING"
        datetime createdAt "default: now()"
        datetime updatedAt "updatedAt"
    }

    DELIVERY_EVENT {
        int id PK "autoincrement"
        int messageId FK "references Message(id) ON DELETE CASCADE"
        DeliveryChannel channel "EMAIL / WHATSAPP"
        string recipient "target email or phone number"
        boolean success "delivery outcome boolean"
        string error "nullable, provider error string"
        datetime createdAt "default: now()"
    }

    SYSTEM_METRIC {
        int id PK "autoincrement (singleton id=1)"
        int totalEmailsSent "default: 0"
        int totalEmailFailures "default: 0"
        int totalWhatsAppSent "default: 0"
        int totalWhatsAppFail "default: 0"
        datetime createdAt "default: now()"
        datetime updatedAt "updatedAt"
    }

    JOB_EXECUTION {
        int id PK "autoincrement"
        string jobName "e.g. messageTriggerService, pushReminderService"
        datetime startedAt "timestamp job began"
        datetime completedAt "nullable, timestamp job completed"
        int duration "execution duration in ms"
        int successCount "default: 0"
        int failureCount "default: 0"
        string status "RUNNING / COMPLETED / FAILED"
    }
```

### Enums & Audit Actions

| Enum Name | Values | Context / Purpose |
| :--- | :--- | :--- |
| **`AuthProvider`** | `LOCAL`, `GOOGLE`, `WHATSAPP` | Allowed authentication mechanisms linked to user identity. |
| **`DeliveryChannel`** | `EMAIL`, `WHATSAPP`, `BOTH` | Destination delivery channels configured for scheduled message dispatches. |
| **`MessageStatus`** | `PENDING`, `SENT`, `FAILED` | Vault message lifecycle status. Marked `FAILED` when `failedAttempts >= 3`. |
| **`AuditLogActions`** | `LOGIN`, `MESSAGE_CREATED`, `MESSAGE_TRIGGERED` | User actions logged for system audit trails. |

---

## 3. Dead Man's Switch, Biometric Pulse & Delivery Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Mobile Client
    participant Bio as Biometric Hardware (LocalAuth)
    participant Server as Express Server
    participant Redis as Redis 7 (Tokens / Queues)
    participant DB as PostgreSQL (Prisma)
    participant Cron as Message Trigger Cron
    participant Worker as BullMQ Worker
    participant Crypto as AES-256-GCM Crypto Engine
    participant Gateway as External Email / WhatsApp Gateways

    %% 1. Biometric Heartbeat Check-In
    Note over User, DB: Scenario A: User Biometric Heartbeat / Check-In
    User->>Bio: Tap LifePulseButton (Prompt Face ID / Touch ID)
    Bio-->>User: Biometric authentication verified (success)
    User->>Server: POST /users/check-in { biometricVerified: true, authMethod: "BIOMETRIC" }
    Server->>DB: UPDATE User SET lastLoginAt = now()
    Server->>Server: Log audit: "User verified check-in with biometric authentication"
    Server-->>User: 200 OK { message: "Biometric check-in verified!", lastLoginAt }

    %% 2. Silent Token Refresh
    Note over User, Redis: Scenario B: Background Silent Token Refresh
    User->>Server: POST /auth/refresh with X-Client-Platform: "mobile"
    Server->>Redis: Check and rotate refresh token with sliding window
    Redis-->>Server: Token valid
    Server-->>User: 200 OK (New accessToken & extended mobile refreshToken)

    %% 3. Inactivity Evaluation & BullMQ Queueing
    Note over Cron, Gateway: Scenario C: Inactivity Threshold Reached & Automated Dispatch
    loop Every 15 Minutes
        Cron->>Server: Trigger runMessageTriggerService()
        Server->>DB: Query PENDING messages with failedAttempts < 3
        DB-->>Server: Return candidate messages + User.lastLoginAt
        Server->>Server: Evaluate: (now - lastLoginAt) >= thresholdDays
        alt User Inactive beyond threshold
            Server->>Redis: BullMQ addBulk([send-message-{id}])
            Server->>DB: Record JobExecution (COMPLETED, count enqueued)
        else User Active
            Server->>DB: Record JobExecution (COMPLETED, 0 enqueued)
        end
    end

    %% 4. Asynchronous Queue Processing & Cryptographic Decryption
    Redis->>Worker: Dispatch delivery job (messageId)
    Worker->>DB: Fetch Message (ciphertext) and User details
    Worker->>Crypto: decryptMessage(content), decryptMessageNullable(title)
    Crypto-->>Worker: Plaintext subject and content

    alt Channel: EMAIL or BOTH
        Worker->>Gateway: Nodemailer dispatch (SMTP / Ethereal)
        Gateway-->>Worker: Email result (success / failure)
    end
    alt Channel: WHATSAPP or BOTH
        Worker->>Gateway: WhatsApp dispatch (Twilio / Meta API)
        Gateway-->>Worker: WhatsApp result (success / failure)
    end

    Worker->>DB: INSERT INTO DeliveryEvent (messageId, channel, recipient, success, error)
    Worker->>DB: UPSERT SystemMetric (increment counters)

    alt All dispatches successful
        Worker->>DB: UPDATE Message SET status = SENT, sentAt = now()
        Worker-->>Redis: Mark BullMQ Job Completed
    else Dispatch failed
        Worker->>DB: UPDATE Message SET failedAttempts = failedAttempts + 1, lastError = err
        Note over Worker, DB: If failedAttempts >= 3 -> status = FAILED
        Worker-->>Redis: Mark Job Failed (BullMQ retries with exponential backoff)
    end
```

---

## 4. Mobile Application Component & State Architecture

```mermaid
flowchart TD
    subgraph Navigation["Expo Router Navigation (apps/mobile/app)"]
        AuthStack["(auth)/login.tsx<br/>• Email / Password Form<br/>• Google OAuth Trigger<br/>• WhatsApp OTP Verification"]
        TabsStack["(tabs)/_layout.tsx<br/>Tab Navigator (Deep Midnight Obsidian Theme)"]
        DashboardTab["(tabs)/index.tsx (Dashboard)<br/>• Brand Header with Pulse Dot<br/>• Radial Countdown Visualizer<br/>• Heartbeat Life Pulse Button<br/>• Status & Urgency Card"]
        MessagesTab["(tabs)/messages.tsx (Vault)<br/>• Urgency-Sorted Message List<br/>• VaultMessageCard with Action Buttons<br/>• Pull-to-refresh & Empty State"]
        SettingsTab["(tabs)/settings.tsx (Settings)<br/>• Inactivity Threshold Preset Chips<br/>• Biometric Toggle Preference<br/>• AES-256 GCM Protection Badge<br/>• Sign Out Modal Dialog"]
        MessageDetail["messages/[id].tsx (View Encrypted/Decrypted Message)"]
        MessageCreate["messages/create.tsx (Compose Vault Message)"]
    end

    subgraph StateAndServices["Mobile Stores & Services"]
        AuthStore["Zustand Auth Store (useAuthStore)<br/>• user, isAuthenticated, isLoading<br/>• performBackgroundCheckIn()<br/>• trySilentTokenRefresh()<br/>• checkIn(biometricVerified)"]
        ApiClient["HTTP Client (apiClient.ts)<br/>• X-Client-Platform header injection<br/>• 401 Interceptor with token queuing<br/>• Automatic silent refresh<br/>• onSessionExpired trigger"]
        BioService["Biometric Service (biometricService.ts)<br/>• getStatus() (Face ID / Touch ID check)<br/>• authenticate() with OS prompt<br/>• AsyncStorage preference toggle"]
        MsgHook["useMessages Hook (TanStack Query)<br/>• fetchMessagesQuery()<br/>• createMessageMutation()<br/>• editMessageMutation()<br/>• deleteMessageMutation()"]
    end

    subgraph VisualComponents["Visual & Interactive Components"]
        PulseBtn["LifePulseButton.tsx<br/>• Animated Pulsing Rings<br/>• Haptic Feedback (Expo Haptics)<br/>• Dynamic Biometric / Heartbeat Label"]
        RadialCount["RadialCountdown.tsx<br/>• react-native-svg Circle<br/>• Animated Stroke Dashoffset<br/>• Urgent / Safe Color Adaptation"]
        VaultCard["VaultMessageCard.tsx<br/>• AES-256 Encrypted Indicator<br/>• Urgency Badge & Days Remaining<br/>• Action Controls (View, Edit, Delete)"]
        ModalComp["ConfirmModal.tsx<br/>• Accessible Dialog for Destructive Actions"]
        SecurityModal["SecurityAuthModal.tsx<br/>• Password Verification Dialog<br/>• Face ID / Biometric Retry<br/>• Disabling Security Gatekeeper"]
    end

    %% Wiring
    DashboardTab --> PulseBtn
    DashboardTab --> RadialCount
    MessagesTab --> VaultCard
    SettingsTab --> ModalComp
    SettingsTab --> SecurityModal

    PulseBtn --> BioService
    PulseBtn --> AuthStore
    DashboardTab --> AuthStore
    MessagesTab --> MsgHook
    SettingsTab --> AuthStore
    SettingsTab --> BioService

    AuthStore --> ApiClient
    MsgHook --> ApiClient
    AuthStack --> AuthStore
    MessageDetail --> MsgHook
    MessageCreate --> MsgHook
```

---

## 5. Push Notification Inactivity Warning Workflow

```mermaid
flowchart TD
    StartCron([Push Reminder Cron Trigger]) --> FetchUsers["Query active users with registered DeviceTokens and pending Messages"]
    FetchUsers --> LoopUsers{"For each user..."}

    LoopUsers --> CalcDays["Calculate daysPassed = (now - user.lastLoginAt) in days"]
    CalcDays --> FindMin["minDaysRemaining = min(triggerThreshold - daysPassed) across user's pending messages"]

    FindMin --> CheckCondition{"Evaluate condition"}

    CheckCondition -->|"0 <= minDaysRemaining <= 7"| ImminentAlert["Create INACTIVITY_WARNING Notification<br/>'You have messages scheduled to be sent in X days'"]
    CheckCondition -->|"daysPassed >= 5 AND daysSinceLastReminder >= 2"| HeartbeatAlert["Create HEARTBEAT_REMINDER Notification<br/>'You haven't checked in recently. Open Last Words to reset.'"]
    CheckCondition -->|"Neither condition met"| NextUser["Skip to next user"]

    ImminentAlert --> SendPush["Dispatch via ExpoPushService to Expo Push Servers"]
    HeartbeatAlert --> SendPush

    SendPush --> RecordReminder["UPDATE User SET lastReminderSentAt = now()"]
    RecordReminder --> NextUser

    NextUser --> MoreUsers{"More users to process?"}
    MoreUsers -- Yes --> LoopUsers
    MoreUsers -- No --> LogExecution["Save execution statistics into JobExecution table"]
    LogExecution --> Done([End Cron Job Execution])
```

---

## 6. Container & Deployment Infrastructure

```mermaid
flowchart LR
    subgraph DockerCompose["Local Development: Docker Compose Topology"]
        subgraph PostgresContainer["last_words_db_container"]
            PGPort["Port 5432"]
            PGData[("postgres_data volume")]
            PGHealth["Healthcheck: pg_isready"]
        end

        subgraph RedisContainer["last_words_redis_container"]
            RedisPort["Port 6379"]
            RedisData[("redis_data volume")]
            RedisHealth["Healthcheck: redis-cli ping"]
        end

        subgraph ApiContainer["last_words_api_container"]
            ApiPort["Port 3000"]
            ApiProcess["Express API Server<br/>+ BullMQ Workers<br/>+ Cron Schedulers"]
        end

        ApiContainer -->|depends_on healthy| PostgresContainer
        ApiContainer -->|depends_on healthy| RedisContainer
    end

    subgraph K8sCluster["Production: Kubernetes Cluster (k8s/)"]
        subgraph K8sNamespace["Namespace: last-words"]
            PGK8s["PostgreSQL StatefulSet / Deployment<br/>postgres-service:5432 (10Gi PVC)"]
            RedisK8s["Redis Deployment<br/>redis-service:6379 (5Gi PVC)"]
            APIK8s["API Pods (Replicas: 2+)<br/>api-service:30080 / 3000"]
            ConfigMapSecrets["ConfigMaps & Secrets<br/>(01-secrets.yaml, 02-configmap.yaml)"]
        end

        ConfigMapSecrets -.-> APIK8s
        ConfigMapSecrets -.-> PGK8s
        ConfigMapSecrets -.-> RedisK8s
        APIK8s --> PGK8s
        APIK8s --> RedisK8s
    end
```
