import express from "express";
import { userValidation } from "../validations/user.validation";
import { validate } from "uuid";
import { verifyUser } from "../middlewares/auth.middleware";
import {
  forgotPassword,
  addNewUser,
  getLoginUserDetail,
  generateAccessToken,
  resetPassword,
  userEmailVerification,
} from "../controllers/user.controller";
import { upload } from "../middlewares/multer.middleware";
import { validateAPI } from "../middlewares/validation.middleware";
import { forgotPasswordValidation } from "../validations/forgotPassword.validation";
import { resetPasswordValidation } from "../validations/resetPassword.validation";
import { emailVerificationValidation } from "../validations/emailVerification.validation";
const userRouter = express.Router();

userRouter.get("/", verifyUser, getLoginUserDetail);
userRouter.post(
  "/",
  upload.single("profileImage"),
  userValidation(),
  validateAPI,
  addNewUser,
);
userRouter.post("/access-token", generateAccessToken);
userRouter.post(
  "/forgot-password",
  forgotPasswordValidation(),
  validateAPI,
  forgotPassword,
);

userRouter.post(
  "/reset-password",
  resetPasswordValidation(),
  validateAPI,
  resetPassword,
);

userRouter.post(
  "/email-verification",
  emailVerificationValidation(),
  validateAPI,
  userEmailVerification,
);
export default userRouter;
