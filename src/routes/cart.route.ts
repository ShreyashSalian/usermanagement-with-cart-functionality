import express from "express";
import {
  addItem,
  applyCoupon,
  deleteItem,
  updateItem,
} from "../controllers/cart.controller";
const cartRouter = express.Router();

cartRouter.post("/add-item", addItem);
cartRouter.post("/delete-item", deleteItem);
cartRouter.post("/update-item", updateItem);
cartRouter.post("/apply-coupon", applyCoupon);

export default cartRouter;
