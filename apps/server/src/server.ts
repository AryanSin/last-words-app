import app from "./app";
import { initializeEmailService } from "./integrations/emailService";
import messageTriggerJob from "./jobs/messageTriggerJob";

const PORT = 3000;

const startServer = async () => {
  try {
    await initializeEmailService();
    messageTriggerJob.start();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Server startup failed:", err);
  }
};

startServer();
