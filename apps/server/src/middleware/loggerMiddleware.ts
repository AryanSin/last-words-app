import fs from "fs";
import path from "path";

export const getFileLogger = (filename: string) => {
  return (logMessage: string, ...args: unknown[]) => {
    const timestamp = new Date().toISOString();
    const finalLog = `[${timestamp}] ${logMessage}\n ${args.map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : arg)).join(" ")}\n`;

    // ALWAYS resolve relative to project root
    const filePath = path.resolve(process.cwd(), filename);
    const dir = path.dirname(filePath);

    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.appendFile(filePath, finalLog, (err) => {
        if (err) {
          console.error("Failed to write to log file:", err);
        }
      });
    } catch (err) {
      console.error("Logger error:", err);
    }
  };
};
