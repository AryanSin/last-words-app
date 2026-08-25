# Last Words Mobile App

React Native mobile client built with Expo Router and TypeScript.

## Setup

1. Configure environment variables in `.env`:
   ```env
   EXPO_PUBLIC_API_URL=http://localhost:3000
   ```
   > Use `http://10.0.2.2:3000` for Android emulator or your local LAN IP for physical test devices.

2. Start the development server:
   ```bash
   pnpm start
   ```

3. Run on target platforms:
   ```bash
   pnpm android
   pnpm ios
   pnpm web
   ```

