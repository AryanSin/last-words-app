import { OAuth2Client } from "google-auth-library";
import { GOOGLE_CLIENT_ID } from "../config/env";
import AppError from "../utils/AppError";
import { logger } from "../utils/loggers";

const client = new OAuth2Client(GOOGLE_CLIENT_ID || undefined);

export interface GoogleUserInfo {
  googleId: string;
  email: string;
  name?: string;
  picture?: string;
  emailVerified: boolean;
}

export const googleAuthService = {
  async verifyIdToken(idToken: string): Promise<GoogleUserInfo> {
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: GOOGLE_CLIENT_ID ? GOOGLE_CLIENT_ID : undefined,
      });

      const payload = ticket.getPayload();

      if (!payload || !payload.sub || !payload.email) {
        throw new AppError("Invalid Google token payload", 400);
      }

      return {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name || payload.given_name,
        picture: payload.picture,
        emailVerified: !!payload.email_verified,
      };
    } catch (err: any) {
      logger.error("Google ID Token verification failed:", err);
      if (err instanceof AppError) throw err;
      throw new AppError(err?.message || "Invalid or expired Google ID token", 401);
    }
  },
};

export default googleAuthService;
