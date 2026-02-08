import express from "express";
import { verifyUser } from "../middlewares/auth.middleware";
import {
  addToWishList,
  removeFromWishList,
} from "../controllers/wishList.controller";

const wishListRouter = express.Router();

wishListRouter.post("/add-item", verifyUser, addToWishList);
wishListRouter.post("/delete-item", verifyUser, removeFromWishList);

export default wishListRouter;
