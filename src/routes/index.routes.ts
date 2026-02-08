import express from "express";
import { CONSTANT_LIST } from "../config/global.constants";
import userRouter from "./user.route";
import authRouter from "./auth.route";
import brandRouter from "./brand.route";
import categoryRouter from "./category.route";
import productRouter from "./product.route";
import inventoryRouter from "./inventory.route";
import couponRouter from "./coupon.route";
import cartRouter from "./cart.route";
import orderRouter from "./order.route";
import ratingRouter from "./rating.route";

import wishListRouter from "./wishList.route";

const indexRouter = express.Router();
indexRouter.use("/api/v1/users", userRouter);
indexRouter.use("/api/v1/auth", authRouter);
indexRouter.use("/api/v1/brand", brandRouter);
indexRouter.use("/api/v1/category", categoryRouter);
indexRouter.use("/api/v1/product", productRouter);
indexRouter.use("/api/v1/inventory", inventoryRouter);
indexRouter.use("/api/v1/coupon", couponRouter);
indexRouter.use("/api/v1/cart", cartRouter);
indexRouter.use("/api/v1/order", orderRouter);
indexRouter.use("/api/v1/rating", ratingRouter);
indexRouter.use("/api/v1/wishList", wishListRouter);
indexRouter.get("/api/v1", (req: express.Request, res: express.Response) => {
  res
    .status(CONSTANT_LIST.STATUS_CODE_OK)
    .json({ message: "The server is running properly." });
});

export default indexRouter;
