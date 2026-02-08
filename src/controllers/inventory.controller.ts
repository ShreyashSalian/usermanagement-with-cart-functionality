import express from "express";
import { asyncHandler, sendError, sendSuccess } from "../utils/function";
import { CONSTANT_LIST } from "../config/global.constants";
import {
  inventoryHelper,
  inventorySearchBody,
} from "../helpers/inventory.helper";
import { InventoryModel } from "../models/inventory.model";
import mongoose from "mongoose";

export const addInventory = asyncHandler(
  async (
    req: express.Request<{}, {}, inventoryHelper>,
    res: express.Response,
  ): Promise<express.Response> => {
    try {
      const {
        productId,
        sku,
        quantity,
        reservedQuantity,
        reorderLevel,
        reorderQuantity,
        warehouseLocation,
        status,
        isActive,
      } = req.body;

      const checkExist = await InventoryModel.findOne({
        productId: productId,
      });
      if (checkExist) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "The quantity has been assigned for the given product",
        );
      }
      const inventoryCreation = await InventoryModel.create({
        productId,
        sku,
        quantity,
        reservedQuantity,
        reorderLevel,
        reorderQuantity,
        warehouseLocation,
        status,
        lastRestockedAt: Date.now(),
        isActive,
      });
      if (inventoryCreation) {
        return sendSuccess(
          res,
          CONSTANT_LIST.STATUS_SUCCESS,
          CONSTANT_LIST.STATUS_CODE_CREATED,
          "Inventoy has been created.",
          inventoryCreation,
        );
      } else {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "Sorry, the inventory can not be added.",
        );
      }
    } catch (err: any) {
      console.error("Error in the list product api:", err);
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

export const getInventory = asyncHandler(
  async (
    req: express.Request<{}, {}, {}, { productId: string }>,
    res: express.Response,
  ): Promise<express.Response> => {
    try {
      const productId = req.query.productId;
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "Invalid productId",
        );
      }
      const inventory = await InventoryModel.aggregate([
        {
          $match: {
            productId: new mongoose.Types.ObjectId(productId),
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        {
          $addFields: {
            productDetails: {
              $first: "$productDetails",
            },
          },
        },
      ]);
      if (inventory) {
        return sendSuccess(
          res,
          CONSTANT_LIST.STATUS_SUCCESS,
          CONSTANT_LIST.STATUS_CODE_OK,
          "The fetched",
          inventory,
        );
      } else {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "Failed to fetched inventory.",
        );
      }
    } catch (err: any) {
      console.error("Error in the fetching inventory api:", err);
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

export const updateInventory = asyncHandler(
  async (
    req: express.Request<{}, {}, inventoryHelper, { inventoryId: string }>,
    res: express.Response,
  ): Promise<express.Response> => {
    try {
      const inventoryId = req.query.inventoryId;
      const {
        productId,
        sku,
        quantity,
        reservedQuantity,
        reorderLevel,
        reorderQuantity,
        warehouseLocation,
        status,
        isActive,
      } = req.body;

      const updateInventory = await InventoryModel.findByIdAndUpdate(
        inventoryId,
        {
          $set: {
            productId,
            sku,
            quantity,
            reservedQuantity,
            reorderLevel,
            reorderQuantity,
            warehouseLocation,
            status,
            isActive,
          },
        },
        {
          new: true,
        },
      );
      if (updateInventory) {
        return sendSuccess(
          res,
          CONSTANT_LIST.STATUS_SUCCESS,
          CONSTANT_LIST.STATUS_CODE_OK,
          "The inventory updated",
          updateInventory,
        );
      } else {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "Sorry can not be updated.",
        );
      }
    } catch (err: any) {
      console.error("Error in the fetching inventory api:", err);
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

export const deleteInventory = asyncHandler(
  async (
    req: express.Request<{}, {}, {}, { inventoryId: string }>,
    res: express.Response,
  ): Promise<express.Response> => {
    try {
      const inventoryId = req.query.inventoryId;
      if (!mongoose.Types.ObjectId.isValid(inventoryId)) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "Invalid invemtory",
        );
      }
      const deleteInventoryDetail = await InventoryModel.findByIdAndUpdate(
        inventoryId,
        {
          $set: {
            isActive: false,
          },
        },
      );
      if (deleteInventoryDetail) {
        return sendSuccess(
          res,
          CONSTANT_LIST.STATUS_SUCCESS,
          CONSTANT_LIST.STATUS_CODE_OK,
          "The inventory updated successfully.",
          null,
        );
      } else {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "Sorry, the inventory can not be updated.",
        );
      }
    } catch (err: any) {
      console.error("Error in the fetching inventory api:", err);
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
export const listAllInventory = asyncHandler(
  async (req: express.Request, res: express.Response) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 19;
      const skip = (page - 1) * limit;
      const warehouseLocation = req.query.warehouseLocation;
      const isActive = req.query.isActive;
      const status = req.query.status;
      const sortBy = req.query.sortBy || "createdAt";
      const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
      const filter: any = {
        isActive: true,
      };
      if (warehouseLocation) {
        filter.warehouseLocation = warehouseLocation;
      }
      if (status) {
        filter.status = status;
      }
      const inventory = await InventoryModel.aggregate([
        {
          $match: filter,
        },
        {
          $lookup: {
            from: "products",
            foreignField: "productId",
            localField: "_id",
            as: "productDetail",
          },
        },
        {
          $addFields: {
            productDetail: {
              $first: "$productDetail",
            },
          },
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
      const total = await InventoryModel.countDocuments(filter);
      if (inventory.length === 0) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "No inventory found.",
        );
      } else {
        return sendSuccess(
          res,
          CONSTANT_LIST.STATUS_SUCCESS,
          CONSTANT_LIST.STATUS_CODE_OK,
          "Inventory detail",
          {
            inventory,
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
      console.error("Error in the fetching inventory api:", err);
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
