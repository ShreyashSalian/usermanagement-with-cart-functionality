import express from "express";
import { asyncHandler, sendError, sendSuccess } from "../utils/function";
import { CONSTANT_LIST } from "../config/global.constants";
import { WishListModel } from "../models/wishList.model";

export const addToWishList = asyncHandler(
  async (
    req: express.Request<{}, {}, { productId: string }>,
    res: express.Response,
  ) => {
    try {
      const { productId } = req.body;
      const userId = req.user?.userId;
      const existing = await WishListModel.findOne({
        userId,
        productId,
      });
      if (existing) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "The product already added in the wishlist",
        );
      }
      const addData = await WishListModel.create({
        productId,
        userId,
      });
      if (addData) {
        return sendSuccess(
          res,
          CONSTANT_LIST.STATUS_SUCCESS,
          CONSTANT_LIST.STATUS_CODE_OK,
          "The product is added in the wishlist.",
          null,
        );
      } else {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "Sorry, the product can not ve added",
        );
      }
    } catch (err: any) {
      console.error("Error in the add to wish list api:", err);
      console.error("Error message:", err?.message);
      console.error("Error stack:", err?.stack);
      return sendError(
        res,
        CONSTANT_LIST.STATUS_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR_MESSAGE,
      );
    }
  },
);

export const removeFromWishList = asyncHandler(
  async (
    req: express.Request<{}, {}, { productId: string }>,
    res: express.Response,
  ) => {
    try {
      const { productId } = req.body;
      const userId = req.user?.userId;
      const deleteItem = await WishListModel.findOneAndDelete({
        userId,
        productId,
      });
      if (deleteItem) {
        return sendSuccess(
          res,
          CONSTANT_LIST.STATUS_SUCCESS,
          CONSTANT_LIST.STATUS_CODE_OK,
          "The product has been deleted from wishlist.",
          null,
        );
      } else {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "Sorry, the product can not be deleted from wishlist.",
        );
      }
    } catch (err: any) {
      console.error("Error in the remove item from wish list api:", err);
      console.error("Error message:", err?.message);
      console.error("Error stack:", err?.stack);
      return sendError(
        res,
        CONSTANT_LIST.STATUS_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR_MESSAGE,
      );
    }
  },
);
