import express from "express";
import { loginValidation } from "../validations/login.validation";
import { validateAPI } from "../middlewares/validation.middleware";
import { login, logout } from "../controllers/auth.controller";
import { verifyUser } from "../middlewares/auth.middleware";
import { changePasswordValidation } from "../validations/changePassword.validation";
import { changePassword } from "../controllers/user.controller";
const authRouter = express.Router();

authRouter.post("/login", loginValidation(), validateAPI, login);

authRouter.post("/logout", verifyUser, logout);
authRouter.post(
  "/change-password",
  changePasswordValidation(),
  validateAPI,
  changePassword,
);
export default authRouter;
