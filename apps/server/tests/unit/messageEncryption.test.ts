import { describe, expect, it, vi } from "vitest";
import prisma from "../../src/config/prisma";
import messageServices from "../../src/services/messageServices";
import { isEncrypted } from "../../src/utils/crypto";

describe("Message Services at-rest Encryption Integration", () => {
  it("should encrypt content and title when creating a message", async () => {
    let savedData: any = null;

    vi.spyOn(prisma.message, "create").mockImplementation(async (args: any) => {
      savedData = args.data;
      return {
        id: 101,
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    const plainTitle = "My Secret Will";
    const plainContent = "Transfer all my bitcoins to wallet xyz.";

    const result = await messageServices.createMessage({
      title: plainTitle,
      content: plainContent,
      userId: 1,
      recipientEmail: "test@example.com",
    });

    // Verify that the data sent to the database is encrypted
    expect(savedData).toBeDefined();
    expect(savedData.content).not.toBe(plainContent);
    expect(savedData.title).not.toBe(plainTitle);
    expect(isEncrypted(savedData.content)).toBe(true);
    expect(isEncrypted(savedData.title)).toBe(true);

    // Verify that the service returns the decrypted message to the caller
    expect(result.content).toBe(plainContent);
    expect(result.title).toBe(plainTitle);
  });

  it("should encrypt content and title when updating a message", async () => {
    let updatedData: any = null;

    vi.spyOn(prisma.message, "update").mockImplementation(async (args: any) => {
      updatedData = args.data;
      return {
        id: 101,
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    const newContent = "Updated last words message.";
    const result = await messageServices.updateMessage(101, {
      content: newContent,
    });

    expect(updatedData.content).not.toBe(newContent);
    expect(isEncrypted(updatedData.content)).toBe(true);
    expect(result.content).toBe(newContent);
  });
});
