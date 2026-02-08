import express from "express";
import path from "path";

import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import swaggerUI from "swagger-ui-express";
import morgan from "morgan";
import { logger } from "./config/logger";
import i18nextMiddleware from "i18next-http-middleware";
import healthRouter from "./routes/health.route";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import indexRouter from "./routes/index.routes";
import { swaggersDocuments } from "./utils/swagger";
import { notFound } from "./middlewares/notFound.middeware";
import i18next from "./config/i18n";
import i18n from "./config/i18n";

const app = express();
app.use(
  cors({
    origin: process.env.ORIGIN,
    methods: "GET,PUT,DELETE,PATCH,HEAD,POST",
    credentials: true,
  }),
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(helmet());
app.use(express.static(path.join(path.resolve(), "public")));
app.use("/images", express.static("/public/images"));
app.use(i18n.init);
app.set("view engine", "hbs");
app.set("views", "./src/views");
app.use(indexRouter);
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggersDocuments));
app.use(
  morgan("combined", {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  }),
);
// Routes
app.use("/health", healthRouter);

// Error handler (must be last)
app.use(notFound);

app.use(errorHandler);
export default app;
