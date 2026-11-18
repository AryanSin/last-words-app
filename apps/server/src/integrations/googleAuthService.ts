import { OAuth2Client } from "google-auth-library";
import {
  GOOGLE_ANDROID_CLIENT_ID,
  GOOGLE_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_WEB_CLIENT_ID,
} from "../config/env";
import AppError from "../utils/AppError";
import { logger } from "../utils/loggers";

const client = new OAuth2Client(GOOGLE_CLIENT_ID || undefined);

// Collect all configured client IDs as valid audiences
const validAudiences = [
  ...GOOGLE_CLIENT_ID.split(",").map((s) => s.trim()),
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_ANDROID_CLIENT_ID,
  GOOGLE_WEB_CLIENT_ID,
].filter(Boolean);

export interface GoogleUserInfo {
  googleId: string;
  email: string;
  name?: string;
  picture?: string;
  emailVerified: boolean;
}

export const googleAuthService = {
  async verifyIdToken(idToken: string): Promise<GoogleUserInfo> {
    // 1. Primary check: Verify via google-auth-library
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience:
          validAudiences.length > 0
            ? validAudiences.length === 1
              ? validAudiences[0]
              : validAudiences
            : undefined,
      });

      const payload = ticket.getPayload();

      if (payload && payload.sub && payload.email) {
        return {
          googleId: payload.sub,
          email: payload.email,
          name: payload.name || payload.given_name,
          picture: payload.picture,
          emailVerified: !!payload.email_verified,
        };
      }
    } catch (err: any) {
      logger.warn(
        "Standard client.verifyIdToken did not resolve token, checking Google userinfo/tokeninfo endpoints...",
      );
    }

    // 2. Fallback check: Google OAuth2 userinfo endpoint (handles OAuth access tokens)
    try {
      const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (userinfoRes.ok) {
        const info = (await userinfoRes.json()) as any;
        if (info.sub && info.email) {
          return {
            googleId: info.sub,
            email: info.email,
            name: info.name || info.given_name,
            picture: info.picture,
            emailVerified: !!info.email_verified,
          };
        }
      }
    } catch {}

    // 3. Fallback check: Google tokeninfo endpoint
    try {
      const tokeninfoRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
      );
      if (tokeninfoRes.ok) {
        const info = (await tokeninfoRes.json()) as any;
        if (info.sub && info.email) {
          return {
            googleId: info.sub,
            email: info.email,
            name: info.name || info.given_name,
            picture: info.picture,
            emailVerified: info.email_verified === "true" || info.email_verified === true,
          };
        }
      }
    } catch {}

    throw new AppError("Invalid or expired Google ID token", 401);
  },
};

export default googleAuthService;
