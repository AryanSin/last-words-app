const JWT_SECRET = process.env.JWT_SECRET || "jwt_secret_change_for_last_words_1234321";
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379;

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const WHATSAPP_PROVIDER = (process.env.WHATSAPP_PROVIDER || "dev").toLowerCase();

// Twilio Config
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || "";

// Meta WhatsApp Cloud API Config
const META_WHATSAPP_TOKEN = process.env.META_WHATSAPP_TOKEN || "";
const META_PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID || "";

// Message Content Encryption Secret
const MESSAGE_ENCRYPTION_SECRET =
  process.env.MESSAGE_ENCRYPTION_SECRET ||
  "message_encryption_secret_for_last_words_1234321";

export {
  GOOGLE_CLIENT_ID,
  JWT_SECRET,
  MESSAGE_ENCRYPTION_SECRET,
  META_PHONE_NUMBER_ID,
  META_WHATSAPP_TOKEN,
  PORT,
  REDIS_HOST,
  REDIS_PORT,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_WHATSAPP_NUMBER,
  WHATSAPP_PROVIDER,
};
