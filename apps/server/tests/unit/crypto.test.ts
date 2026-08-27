import { describe, expect, it } from "vitest";
import {
  decryptMessage,
  decryptMessageList,
  decryptMessageNullable,
  decryptMessageObject,
  encryptMessage,
  encryptMessageNullable,
  isEncrypted,
} from "../../src/utils/crypto";

describe("crypto utility (AES-256-GCM message encryption)", () => {
  it("should encrypt and decrypt a plaintext message successfully", () => {
    const originalText = "This is a very confidential last words message.";
    const encrypted = encryptMessage(originalText);

    expect(encrypted).not.toBe(originalText);
    expect(encrypted.startsWith("enc:v1:")).toBe(true);
    expect(isEncrypted(encrypted)).toBe(true);

    const decrypted = decryptMessage(encrypted);
    expect(decrypted).toBe(originalText);
  });

  it("should generate different ciphertexts (different IVs) for the same plaintext", () => {
    const text = "Secret message content";
    const enc1 = encryptMessage(text);
    const enc2 = encryptMessage(text);

    expect(enc1).not.toBe(enc2);
    expect(decryptMessage(enc1)).toBe(text);
    expect(decryptMessage(enc2)).toBe(text);
  });

  it("should handle empty or falsy strings gracefully", () => {
    expect(encryptMessage("")).toBe("");
    expect(decryptMessage("")).toBe("");
  });

  it("should handle nullable helper functions", () => {
    expect(encryptMessageNullable(null)).toBe(null);
    expect(encryptMessageNullable(undefined)).toBe(undefined);
    expect(decryptMessageNullable(null)).toBe(null);
    expect(decryptMessageNullable(undefined)).toBe(undefined);

    const enc = encryptMessageNullable("Valid text");
    expect(isEncrypted(enc)).toBe(true);
    expect(decryptMessageNullable(enc)).toBe("Valid text");
  });

  it("should fallback gracefully if given unencrypted plaintext (backwards compatibility)", () => {
    const plain = "Legacy unencrypted message from old database dump";
    expect(isEncrypted(plain)).toBe(false);
    expect(decryptMessage(plain)).toBe(plain);
  });

  it("should detect tamper/corruption and throw an error", () => {
    const originalText = "Tamper check message";
    const encrypted = encryptMessage(originalText);

    // Tamper with the ciphertext part
    const parts = encrypted.split(":");
    // parts: ['enc', 'v1', iv, authTag, ciphertext]
    const tamperedCiphertext = parts[4].slice(0, -4) + "AAAA";
    const tampered = `${parts[0]}:${parts[1]}:${parts[2]}:${parts[3]}:${tamperedCiphertext}`;

    expect(() => decryptMessage(tampered)).toThrow();
  });

  it("should decrypt message object and list of objects correctly", () => {
    const msg = {
      id: 1,
      title: encryptMessage("My Will"),
      content: encryptMessage("Give everything to charity."),
      recipientEmail: "lawyer@example.com",
    };

    const decrypted = decryptMessageObject(msg);
    expect(decrypted.title).toBe("My Will");
    expect(decrypted.content).toBe("Give everything to charity.");
    expect(decrypted.recipientEmail).toBe("lawyer@example.com");

    const list = [msg, { id: 2, title: null, content: encryptMessage("Goodbye") }];
    const decryptedList = decryptMessageList(list);
    expect(decryptedList[0].title).toBe("My Will");
    expect(decryptedList[1].title).toBe(null);
    expect(decryptedList[1].content).toBe("Goodbye");
  });
});
