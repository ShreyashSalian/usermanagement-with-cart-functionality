import express from "express";
import { CONSTANT_LIST } from "../config/global.constants";
import { asyncHandler, sendError, sendSuccess } from "../utils/function";
import { ProductModel } from "../models/product.model";
import { ProductRatingModel } from "../models/rating.model";
export const addRating = asyncHandler(
  async (
    req: express.Request<{}, {}, { productId: string; rating: number }>,
    res: express.Response,
  ) => {
    try {
      const { productId, rating } = req.body;
      const userId = req.user?.userId;
      const product = await ProductModel.findById(productId);
      if (!product) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.NO_DATA_FOUND,
          "Sorry, no product found",
        );
      }
      const existingRating = await ProductRatingModel.findOne({
        productId,
        userId,
      });
      if (existingRating) {
        existingRating.rating = rating;
        await existingRating.save();
      } else {
        await ProductRatingModel.create({
          userId,
          productId,
          rating,
        });
      }
      const allRating = await ProductRatingModel.find({ productId });
      const totalRating = allRating.length;
      const averageRating = allRating.reduce(
        (sum, rate) => sum + rate.rating / totalRating,
        0,
      );
      product.averageRating = averageRating;
      product.totalRating = totalRating;
      return sendSuccess(
        res,
        CONSTANT_LIST.STATUS_SUCCESS,
        CONSTANT_LIST.STATUS_CODE_OK,
        "The rating updated",
        {
          averageRating,
          totalRating,
        },
      );
    } catch (err: any) {
      console.error("Error in the add rating api:", err);
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
export const deleteRating = asyncHandler(
  async (
    req: express.Request<{}, {}, { productId: string; rating: number }>,
    res: express.Response,
  ) => {
    try {
      const { productId, rating } = req.body;
      const userId = req.user?.userId;
      const product = await ProductModel.findById(productId);
      if (!product) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.NO_DATA_FOUND,
          "Sorry, no product found",
        );
      }
      const existingRating = await ProductRatingModel.findOne({
        productId,
        userId,
      });
      if (!existingRating) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "Sorry, the user has not given rating for this product.",
        );
      }
      await ProductRatingModel.findOneAndDelete({
        productId,
        userId,
      });
      const allRating = await ProductRatingModel.find({ productId });
      const totalRating = allRating.length;
      const averageRating = allRating.reduce(
        (sum, rate) => sum + rate.rating / totalRating,
        0,
      );
      product.averageRating = averageRating;
      product.totalRating = totalRating;
      return sendSuccess(
        res,
        CONSTANT_LIST.STATUS_SUCCESS,
        CONSTANT_LIST.STATUS_CODE_OK,
        "The rating updated",
        {
          averageRating,
          totalRating,
        },
      );
    } catch (err: any) {
      console.error("Error in the delete rating api:", err);
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
