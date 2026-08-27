import crypto from "crypto";
import { MESSAGE_ENCRYPTION_SECRET } from "../config/env";
import { logger } from "./loggers";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits standard for AES-GCM
const AUTH_TAG_LENGTH = 16; // 128 bits
const ENCRYPTION_PREFIX = "enc:v1:";
const SALT = "last-words-crypto-salt-v1";

// Derive 32-byte (256-bit) key using scrypt
const MASTER_KEY = crypto.scryptSync(MESSAGE_ENCRYPTION_SECRET, SALT, 32);

/**
 * Checks if a string is encrypted with our format
 */
export function isEncrypted(text: unknown): boolean {
  return typeof text === "string" && text.startsWith(ENCRYPTION_PREFIX);
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Output format: enc:v1:<iv_b64>:<authTag_b64>:<ciphertext_b64>
 */
export function encryptMessage(plainText: string): string {
  if (!plainText) {
    return plainText;
  }

  // Generate random 12-byte IV for every encryption call
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, MASTER_KEY, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(plainText, "utf8", "base64");
  encrypted += cipher.final("base64");
  const authTag = cipher.getAuthTag();

  return `${ENCRYPTION_PREFIX}${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted string.
 * If the input is not encrypted (e.g. legacy data or already plaintext), returns it as-is.
 */
export function decryptMessage(cipherTextCombined: string): string {
  if (!cipherTextCombined || !isEncrypted(cipherTextCombined)) {
    return cipherTextCombined;
  }

  try {
    const raw = cipherTextCombined.slice(ENCRYPTION_PREFIX.length);
    const parts = raw.split(":");

    if (parts.length !== 3) {
      logger.warn("Encountered malformed encrypted payload prefix, returning raw text.");
      return cipherTextCombined;
    }

    const [ivBase64, authTagBase64, cipherTextBase64] = parts;
    const iv = Buffer.from(ivBase64, "base64");
    const authTag = Buffer.from(authTagBase64, "base64");

    const decipher = crypto.createDecipheriv(ALGORITHM, MASTER_KEY, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(cipherTextBase64, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (err: any) {
    logger.error("Failed to decrypt message content:", err);
    throw new Error("Failed to decrypt message content: authentication verification failed or data corrupted");
  }
}

/**
 * Encrypts a nullable or optional string
 */
export function encryptMessageNullable<T extends string | null | undefined>(
  text: T,
): T {
  if (text === null || text === undefined || text === "") {
    return text;
  }
  return encryptMessage(text) as T;
}

/**
 * Decrypts a nullable or optional string
 */
export function decryptMessageNullable<T extends string | null | undefined>(
  text: T,
): T {
  if (text === null || text === undefined || text === "") {
    return text;
  }
  return decryptMessage(text) as T;
}

/**
 * Helper to decrypt content and title fields on any message object
 */
export function decryptMessageObject<
  T extends { content?: string | null; title?: string | null }
>(msg: T): T {
  if (!msg) return msg;
  return {
    ...msg,
    content: typeof msg.content === "string" ? decryptMessage(msg.content) : msg.content,
    title: typeof msg.title === "string" ? decryptMessageNullable(msg.title) : msg.title,
  };
}

/**
 * Helper to decrypt a list of message objects
 */
export function decryptMessageList<
  T extends { content?: string | null; title?: string | null }
>(list: T[]): T[] {
  if (!Array.isArray(list)) return list;
  return list.map(decryptMessageObject);
}
