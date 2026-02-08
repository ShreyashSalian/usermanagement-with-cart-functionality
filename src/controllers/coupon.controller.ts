import express from "express";
import { asyncHandler, sendError, sendSuccess } from "../utils/function";
import { CONSTANT_LIST } from "../config/global.constants";
import { couponHelper } from "../helpers/coupon.helper";
import { CouponModel } from "../models/coupon.model";

export const addCoupon = asyncHandler(
  async (
    req: express.Request<{}, {}, couponHelper>,
    res: express.Response,
  ): Promise<express.Response> => {
    try {
      const {
        code,
        discountType,
        discountValue,
        minCartValue,
        maxDiscount,
        startDate,
        endDate,
        usageLimit,
        isActive,
      } = req.body;
      const checkCoupon = await CouponModel.findOne({
        code,
      });
      if (checkCoupon) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "The coupon code already created with given code",
        );
      }
      const couponCreation = await CouponModel.create({
        code,
        discountType,
        discountValue,
        minCartValue,
        maxDiscount,
        startDate,
        endDate,
        usageLimit,
        isActive,
      });
      if (couponCreation) {
        return sendSuccess(
          res,
          CONSTANT_LIST.STATUS_SUCCESS,
          CONSTANT_LIST.STATUS_CODE_CREATED,
          "The coupon created successfully>",
          couponCreation,
        );
      } else {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "Sorry, the coupon can not be added.",
        );
      }
    } catch (err: any) {
      console.error("Error in the add coupon api:", err);
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

export const updateCoupon = asyncHandler(
  async (
    req: express.Request<{}, {}, couponHelper, { couponId: string }>,
    res: express.Response,
  ): Promise<express.Response> => {
    try {
      const {
        code,
        discountType,
        discountValue,
        minCartValue,
        maxDiscount,
        startDate,
        endDate,
        usageLimit,
        isActive,
      } = req.body;

      const couponId = req.query.couponId;

      const checkCoupon = await CouponModel.findOne({
        code,
        _id: { $ne: couponId }, // exclude current category
      });

      if (checkCoupon) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "The coupon code already created with given code",
        );
      }
      const couponUpdateData = await CouponModel.findByIdAndUpdate(
        couponId,
        {
          $set: {
            code,
            discountType,
            discountValue,
            minCartValue,
            maxDiscount,
            startDate,
            endDate,
            usageLimit,
            isActive,
          },
        },
        {
          new: true,
        },
      );
      if (couponUpdateData) {
        return sendSuccess(
          res,
          CONSTANT_LIST.STATUS_SUCCESS,
          CONSTANT_LIST.STATUS_CODE_CREATED,
          "The coupon updated successfully>",
          couponUpdateData,
        );
      } else {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "Sorry, the coupon can not be updated.",
        );
      }
    } catch (err: any) {
      console.error("Error in the add coupon api:", err);
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
export const deleteCoupon = asyncHandler(
  async (
    req: express.Request<{}, {}, {}, { couponId: string }>,
    res: express.Response,
  ): Promise<express.Response> => {
    try {
      const couponId = req.query.couponId;
      const coupon = await CouponModel.findById(couponId);
      if (!coupon) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "Sorry, no coupon found.",
        );
      }
      const findCouponAndUpdate = await CouponModel.findByIdAndUpdate(
        couponId,
        {
          $set: {
            isActive: false,
          },
        },
      );
      if (findCouponAndUpdate) {
        return sendSuccess(
          res,
          CONSTANT_LIST.STATUS_SUCCESS,
          CONSTANT_LIST.STATUS_CODE_OK,
          "The coupon code deleted successfully.",
          null,
        );
      } else {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "Sorry, the coupon can not be deleted.",
        );
      }
    } catch (err: any) {
      console.error("Error in the add coupon api:", err);
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
export const listAllCoupon = asyncHandler(
  async (
    req: express.Request,
    res: express.Response,
  ): Promise<express.Response> => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 19;
      const skip = (page - 1) * limit;
      const status = req.query.status;
      const sortBy = req.query.sortBy || "createdAt";
      const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
      const search = req.query.search;

      const searchFilter = search
        ? {
            code: { $regex: search, $options: "i" },
          }
        : {};

      const matchFilter = {
        ...searchFilter,
        isActive: true,
      };

      const couponData = await CouponModel.aggregate([
        {
          $match: matchFilter,
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
      ]);
      const total = await CouponModel.countDocuments(matchFilter);
      if (couponData.length === 0) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.NO_DATA_FOUND,
          "Sorry, no coupon found",
        );
      } else {
        return sendSuccess(
          res,
          CONSTANT_LIST.STATUS_SUCCESS,
          CONSTANT_LIST.STATUS_CODE_OK,
          "Coupon list",
          {
            couponData,
            pagination: {
              totalRecords: total,
              currentPage: page,
              totalPage: Math.ceil(total / limit),
              pageSize: limit,
            },
          },
        );
      }
    } catch (err: any) {
      console.error("Error in the add coupon api:", err);
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
export const getCoupon = asyncHandler(
  async (
    req: express.Request<{}, {}, {}, { couponId: string }>,
    res: express.Response,
  ): Promise<express.Response> => {
    try {
      const couponId = req.query.couponId;
      const couponData = await CouponModel.findById(couponId);
      if (!couponData) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.NO_DATA_FOUND,
          "Sorry, no coupon found",
        );
      } else {
        return sendSuccess(
          res,
          CONSTANT_LIST.STATUS_SUCCESS,
          CONSTANT_LIST.STATUS_CODE_OK,
          "Coupon code data",
          couponData,
        );
      }
    } catch (err: any) {
      console.error("Error in the get coupon api:", err);
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
