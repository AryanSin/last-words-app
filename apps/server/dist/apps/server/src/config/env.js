"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WHATSAPP_PROVIDER = exports.TWILIO_WHATSAPP_NUMBER = exports.TWILIO_AUTH_TOKEN = exports.TWILIO_ACCOUNT_SID = exports.REDIS_URL = exports.REDIS_PORT = exports.REDIS_PASSWORD = exports.REDIS_HOST = exports.PORT = exports.META_WHATSAPP_TOKEN = exports.META_PHONE_NUMBER_ID = exports.MESSAGE_ENCRYPTION_SECRET = exports.JWT_SECRET = exports.GOOGLE_WEB_CLIENT_ID = exports.GOOGLE_IOS_CLIENT_ID = exports.GOOGLE_CLIENT_ID = exports.GOOGLE_ANDROID_CLIENT_ID = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const JWT_SECRET = process.env.JWT_SECRET || "jwt_secret_change_for_last_words_1234321";
exports.JWT_SECRET = JWT_SECRET;
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
exports.PORT = PORT;
const REDIS_HOST = process.env.REDIS_HOST || "localhost";
exports.REDIS_HOST = REDIS_HOST;
const REDIS_PORT = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379;
exports.REDIS_PORT = REDIS_PORT;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || "";
exports.REDIS_PASSWORD = REDIS_PASSWORD;
const REDIS_URL = process.env.REDIS_URL || "";
exports.REDIS_URL = REDIS_URL;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
exports.GOOGLE_CLIENT_ID = GOOGLE_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.GOOGLE_IOS_CLIENT_ID || "";
exports.GOOGLE_IOS_CLIENT_ID = GOOGLE_IOS_CLIENT_ID;
const GOOGLE_ANDROID_CLIENT_ID = process.env.GOOGLE_ANDROID_CLIENT_ID || "";
exports.GOOGLE_ANDROID_CLIENT_ID = GOOGLE_ANDROID_CLIENT_ID;
const GOOGLE_WEB_CLIENT_ID = process.env.GOOGLE_WEB_CLIENT_ID || "";
exports.GOOGLE_WEB_CLIENT_ID = GOOGLE_WEB_CLIENT_ID;
const WHATSAPP_PROVIDER = (process.env.WHATSAPP_PROVIDER || "dev").toLowerCase();
exports.WHATSAPP_PROVIDER = WHATSAPP_PROVIDER;
// Twilio Config
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "";
exports.TWILIO_ACCOUNT_SID = TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
exports.TWILIO_AUTH_TOKEN = TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || "";
exports.TWILIO_WHATSAPP_NUMBER = TWILIO_WHATSAPP_NUMBER;
// Meta WhatsApp Cloud API Config
const META_WHATSAPP_TOKEN = process.env.META_WHATSAPP_TOKEN || "";
exports.META_WHATSAPP_TOKEN = META_WHATSAPP_TOKEN;
const META_PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID || "";
exports.META_PHONE_NUMBER_ID = META_PHONE_NUMBER_ID;
// Message Content Encryption Secret
const MESSAGE_ENCRYPTION_SECRET = process.env.MESSAGE_ENCRYPTION_SECRET ||
    "message_encryption_secret_for_last_words_1234321";
exports.MESSAGE_ENCRYPTION_SECRET = MESSAGE_ENCRYPTION_SECRET;
