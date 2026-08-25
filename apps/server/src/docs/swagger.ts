import { Router } from "express";
import path from "path";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";

const swaggerRouter = Router();

try {
  const swaggerDocument = YAML.load(path.join(__dirname, "openapi.yaml"));
  swaggerRouter.use("/", swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customSiteTitle: "Last Words API Documentation",
  }));
} catch (err) {
  console.error("Failed to load OpenAPI definition:", err);
}

export default swaggerRouter;
