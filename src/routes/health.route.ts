import express from "express";

import { logger } from "../config/logger";

const healthRouter = express.Router();

healthRouter.get("/", (req: express.Request, res: express.Response) => {
  logger.info("Health check endpoint called");
  res.json({ status: "OK" });
});

export default healthRouter;
