// import { Request, Response, NextFunction } from "express";
// import { AppError } from "../utils/AppErrot";

// export const notFound = (req: Request, res: Response, next: NextFunction) => {
//   next(new AppError(`Route not found: ${req.originalUrl}`, 404));
// };
import express from "express";

interface CustomError extends Error {
  statusCode?: number;
}

export const notFound = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  const error: CustomError = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};
