---
type: "query"
date: "2026-11-27T05:33:56.310008+00:00"
question: "What is the final architecture and feature set of last-words-app for updating Resume.tex?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["Last Words pnpm Monorepo", "AES-256-GCM Vault Encryption Principle", "messageDeliveryWorker.ts", "biometricService.ts", "vercel.json", "Docker Compose & Kubernetes Deployment Topology"]
---

# Q: What is the final architecture and feature set of last-words-app for updating Resume.tex?

## Answer

Expanded from original query via vocab: [aes, gcm, bullmq, cron, biometric, expo, prisma, redis, jwt, oauth, vercel, kubernetes]. Traversed graphify-out/graph.json: last-words-app is a pnpm monorepo (packages/shared with Zod schemas and TS types) comprising an Express/TypeScript/Prisma/PostgreSQL backend with decoupled BullMQ/Redis worker, node-cron inactivity trigger and Expo push reminder jobs, AES-256-GCM vault encryption, hybrid JWT/Google OAuth/WhatsApp OTP auth with Redis token blacklisting, atomic Redis Lua sliding-window rate limiting, Docker Compose & Kubernetes manifests, and a React Native (Expo SDK 58 / Expo Router) + React Native Web (Vercel) client using Zustand, TanStack Query, and expo-local-authentication biometric check-in.

## Outcome

- Signal: useful

## Source Nodes

- Last Words pnpm Monorepo
- AES-256-GCM Vault Encryption Principle
- messageDeliveryWorker.ts
- biometricService.ts
- vercel.json
- Docker Compose & Kubernetes Deployment Topology