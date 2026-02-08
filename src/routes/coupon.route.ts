import express from "express";
import { checkAdmin, verifyUser } from "../middlewares/auth.middleware";
import { couponValidation } from "../validations/coupon.validation";
import { validateAPI } from "../middlewares/validation.middleware";
import {
  addCoupon,
  deleteCoupon,
  getCoupon,
  listAllCoupon,
  updateCoupon,
} from "../controllers/coupon.controller";

const couponRouter = express.Router();

couponRouter.post(
  "/",
  verifyUser,
  checkAdmin,
  couponValidation(),
  validateAPI,
  addCoupon,
);

couponRouter.put(
  "/",
  verifyUser,
  checkAdmin,
  couponValidation(),
  validateAPI,
  updateCoupon,
);
couponRouter.get("/", verifyUser, checkAdmin, getCoupon);

couponRouter.delete("/", verifyUser, checkAdmin, deleteCoupon);
couponRouter.get("/list-coupon", verifyUser, checkAdmin, listAllCoupon);

export default couponRouter;
