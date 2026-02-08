import express from "express";
import { verifyUser } from "../middlewares/auth.middleware";
import { placeOrder } from "../controllers/order,controller";

const orderRouter = express.Router();

orderRouter.post("/", verifyUser, placeOrder);

export default orderRouter;
