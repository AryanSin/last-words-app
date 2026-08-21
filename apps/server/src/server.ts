import app from "./app";
import { PORT } from "./config/env";
import { initializeEmailService } from "./integrations/emailService";
import messageTriggerJob from "./jobs/messageTriggerJob";

const startServer = async () => {
  try {
    await initializeEmailService();
    messageTriggerJob.start();
    app.listen(PORT, () => {
      console.log(`🚀 Last Words Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Server startup failed:", err);
  }
};

startServer();
