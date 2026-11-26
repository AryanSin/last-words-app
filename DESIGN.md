# Design System

<!-- impeccable:design-schema 1 -->

## Visual World

**Midnight Obsidian Vault**: A solemn, reassuring, high-precision dark aesthetic rooted in cryptographic permanence and quiet vitality. Built for an automated dead-man's switch and digital message vault where false alarms and early triggers are unacceptable.

## Colors

### Dark Theme (Primary / Default)
- `background`: `#080C14` (Deep Midnight Obsidian)
- `surface`: `#0F172A` (Obsidian Slate)
- `surfaceRaised`: `#1E293B` (Elevated Charcoal Slate)
- `inputBackground`: `#090D16`
- `card`: `#111827`

- `border`: `#1E293B`
- `borderSubtle`: `#111827`
- `borderHighlight`: `#334155`

- `text`: `#F8FAFC` (High contrast pure white/slate)
- `textMuted`: `#94A3B8` (Calm secondary label slate)
- `textSubtle`: `#64748B` (Tertiary captions)

- `primary`: `#38BDF8` (Radiant Sky Cyan — interactive tint & emphasis)
- `primarySurface`: `rgba(56, 189, 248, 0.12)`
- `primaryBorder`: `#0284C7`

- `pulseEmerald`: `#10B981` (Living Heartbeat Emerald — safe switch status & life pulse)
- `pulseEmeraldSurface`: `rgba(16, 185, 129, 0.15)`

- `warning`: `#F59E0B` (Amber Warning — urgent thresholds under 7 days)
- `warningSurface`: `rgba(245, 158, 11, 0.15)`

- `danger`: `#EF4444` (Final Grace Alert / Destructive actions)
- `dangerSurface`: `rgba(239, 68, 68, 0.15)`

- `whatsapp`: `#25D366` (Meta WhatsApp Brand Green)
- `arcGradientSafe`: `#10B981` (Heartbeat Emerald) to `#38BDF8` (Sky Cyan)
- `arcGradientUrgent`: `#F59E0B` (Topaz Amber) to `#EF4444` (Crimson Alert)
- `ambientGlow`: `rgba(16, 185, 129, 0.08)` safe / `rgba(245, 158, 11, 0.12)` urgent

### Light Theme
- `background`: `#F8FAFC`
- `surface`: `#FFFFFF`
- `surfaceRaised`: `#F1F5F9`
- `border`: `#E2E8F0`
- `text`: `#0F172A`
- `primary`: `#0284C7`
- `pulseEmerald`: `#059669`

## Typography

- **Display Numbers**: `54pt`, `fontWeight: "800"`, `letterSpacing: -1.5` with tabular numeral alignment.
- **Screen Titles**: `20pt`, `fontWeight: "800"`, `letterSpacing: -0.3`.
- **Card Section Titles**: `14–15pt`, `fontWeight: "700"`.
- **Body Text**: `14–15pt`, `lineHeight: 20–22`.
- **Labels & Micro-Badges**: `10–11pt`, `fontWeight: "700–800"`, `letterSpacing: 0.6–1.4`.

## Core Components & Patterns

1. **Unboxed Focal Hero (`RadialCountdown`)**:
   - Expansive 210×210 diameter circular progress arc (`radius: 88`, `strokeWidth: 7`).
   - Starts at 12 o'clock via `transform="rotate(-90 105 105)"`.
   - Generous interior breathing space with `54pt` countdown numeral, `11pt` label, and emerald/warning status micro-pill.

2. **Life Pulse Activation Ritual (`LifePulseButton`)**:
   - Unified biometric activation bar (`64pt` minHeight) with haptic feedback (`Haptics.notificationAsync`) and pulsing radar ring.
   - Discreet last verified heartbeat timestamp directly beneath the button.

3. **Inactivity Safety Net Timeline**:
   - Open vertical milestone timeline (14d advance warning, 7d urgent alert, 24h grace window) with continuous connecting line rather than nested box-in-box cards.

4. **Vault Message Card (`VaultMessageCard`)**:
   - Defensive typography (`numberOfLines={1}`, `ellipsizeMode="tail"` on recipient and title).
   - Unshrinkable badges and actions (`flexShrink: 0`).
   - Touch targets $\ge 44\times 44\text{ pt}$ on all interactive buttons.

5. **Message Authoring & Sealing Chamber (`create.tsx`, `edit.tsx`)**:
   - Multi-channel delivery route selector (`EMAIL`, `WHATSAPP`, `BOTH`) with live icon cards.
   - International E.164 phone input validation for WhatsApp.
   - Collapsible live autonomous dispatch preview simulating recipient's inbox experience.
   - Clear "Seal & Arm in Vault" action with haptic confirmation.

6. **Vault Search & Segmented Filter Bar (`messages.tsx`)**:
   - Instant search input across title, recipient name, phone, email, and content.
   - High-contrast segmented filter chips (`ALL`, `ARMED`, `DISPATCHED`).
