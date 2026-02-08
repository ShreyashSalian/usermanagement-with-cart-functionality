import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger";
import { CONSTANT_LIST } from "../config/global.constants";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  logger.error(err);

  const statusCode = err?.statusCode || 500;

  res.status(statusCode).json({
    status: CONSTANT_LIST.STATUS_ERROR,
    statusCode,
    successMessage: null,
    errorMessage: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};
