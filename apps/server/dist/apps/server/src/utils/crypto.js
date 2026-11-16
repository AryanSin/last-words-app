"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEncrypted = isEncrypted;
exports.encryptMessage = encryptMessage;
exports.decryptMessage = decryptMessage;
exports.encryptMessageNullable = encryptMessageNullable;
exports.decryptMessageNullable = decryptMessageNullable;
exports.decryptMessageObject = decryptMessageObject;
exports.decryptMessageList = decryptMessageList;
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../config/env");
const loggers_1 = require("./loggers");
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits standard for AES-GCM
const AUTH_TAG_LENGTH = 16; // 128 bits
const ENCRYPTION_PREFIX = "enc:v1:";
const SALT = "last-words-crypto-salt-v1";
// Derive 32-byte (256-bit) key using scrypt
const MASTER_KEY = crypto_1.default.scryptSync(env_1.MESSAGE_ENCRYPTION_SECRET, SALT, 32);
/**
 * Checks if a string is encrypted with our format
 */
function isEncrypted(text) {
    return typeof text === "string" && text.startsWith(ENCRYPTION_PREFIX);
}
/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Output format: enc:v1:<iv_b64>:<authTag_b64>:<ciphertext_b64>
 */
function encryptMessage(plainText) {
    if (!plainText) {
        return plainText;
    }
    // Generate random 12-byte IV for every encryption call
    const iv = crypto_1.default.randomBytes(IV_LENGTH);
    const cipher = crypto_1.default.createCipheriv(ALGORITHM, MASTER_KEY, iv, {
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
function decryptMessage(cipherTextCombined) {
    if (!cipherTextCombined || !isEncrypted(cipherTextCombined)) {
        return cipherTextCombined;
    }
    try {
        const raw = cipherTextCombined.slice(ENCRYPTION_PREFIX.length);
        const parts = raw.split(":");
        if (parts.length !== 3) {
            loggers_1.logger.warn("Encountered malformed encrypted payload prefix, returning raw text.");
            return cipherTextCombined;
        }
        const [ivBase64, authTagBase64, cipherTextBase64] = parts;
        const iv = Buffer.from(ivBase64, "base64");
        const authTag = Buffer.from(authTagBase64, "base64");
        const decipher = crypto_1.default.createDecipheriv(ALGORITHM, MASTER_KEY, iv, {
            authTagLength: AUTH_TAG_LENGTH,
        });
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(cipherTextBase64, "base64", "utf8");
        decrypted += decipher.final("utf8");
        return decrypted;
    }
    catch (err) {
        loggers_1.logger.error("Failed to decrypt message content:", err);
        throw new Error("Failed to decrypt message content: authentication verification failed or data corrupted");
    }
}
/**
 * Encrypts a nullable or optional string
 */
function encryptMessageNullable(text) {
    if (text === null || text === undefined || text === "") {
        return text;
    }
    return encryptMessage(text);
}
/**
 * Decrypts a nullable or optional string
 */
function decryptMessageNullable(text) {
    if (text === null || text === undefined || text === "") {
        return text;
    }
    return decryptMessage(text);
}
/**
 * Helper to decrypt content and title fields on any message object
 */
function decryptMessageObject(msg) {
    if (!msg)
        return msg;
    return {
        ...msg,
        content: typeof msg.content === "string" ? decryptMessage(msg.content) : msg.content,
        title: typeof msg.title === "string" ? decryptMessageNullable(msg.title) : msg.title,
    };
}
/**
 * Helper to decrypt a list of message objects
 */
function decryptMessageList(list) {
    if (!Array.isArray(list))
        return list;
    return list.map(decryptMessageObject);
}
