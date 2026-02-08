import express from "express";
import { v4 as uuidv4 } from "uuid";
import {
  asyncHandler,
  filterFieldList,
  sendError,
  sendSuccess,
} from "../utils/function";
import { CONSTANT_LIST } from "../config/global.constants";
import { CartModel } from "../models/cart.model";
import { CouponModel } from "../models/coupon.model";
import { InventoryModel } from "../models/inventory.model";
import { ORDER_STATUS, OrderModel } from "../models/order.model";
import { emailQueue } from "../utils/queue/email.queue";
import { productSearchBody } from "../helpers/category.helper";
import { UserModel } from "../models/user.model";

export const placeOrder = asyncHandler(
  async (
    req: express.Request<{}, {}, { cartId: string }>,
    res: express.Response,
  ): Promise<express.Response> => {
    try {
      const { cartId } = req.body;
      const userId = req.user?.userId;

      // 1️⃣ Fetch cart
      const cart = await CartModel.findOne({ cartId, userId });
      if (!cart) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.NO_DATA_FOUND,
          "No cart found",
        );
      }

      let discountAmount = 0;
      let appliedCouponCode: string | null = null;

      // 2️⃣ Coupon handling (OPTIONAL)
      if (cart.couponCode) {
        const coupon = await CouponModel.findOne({
          code: cart.couponCode.toUpperCase(),
          isActive: true,
          usedByUsers: { $ne: userId },
        });

        if (!coupon) {
          return sendError(
            res,
            CONSTANT_LIST.STATUS_ERROR,
            CONSTANT_LIST.BAD_REQUEST,
            "Invalid coupon or already used.",
          );
        }

        const now = new Date();

        if (coupon.startDate > now)
          return sendError(
            res,
            CONSTANT_LIST.STATUS_ERROR,
            CONSTANT_LIST.BAD_REQUEST,
            "Coupon code date has not be started. ",
          );

        if (coupon.endDate < now)
          return sendError(
            res,
            CONSTANT_LIST.STATUS_ERROR,
            CONSTANT_LIST.BAD_REQUEST,
            "Coupon expired.",
          );

        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)
          return sendError(
            res,
            CONSTANT_LIST.STATUS_ERROR,
            CONSTANT_LIST.BAD_REQUEST,
            "Coupon usage limit exceeded.",
          );

        if (cart.bill < coupon.minCartValue)
          return sendError(
            res,
            CONSTANT_LIST.STATUS_ERROR,
            CONSTANT_LIST.BAD_REQUEST,
            `Minimum cart value should be ₹${coupon.minCartValue}`,
          );

        // 🔥 Discount calculation
        if (coupon.discountType === "percentage") {
          discountAmount = Math.min(
            (cart.bill * coupon.discountValue) / 100,
            coupon.maxDiscount,
          );
        } else {
          discountAmount = coupon.discountValue;
        }

        appliedCouponCode = coupon.code;

        // mark coupon usage
        await CouponModel.updateOne(
          { _id: coupon._id },
          {
            $inc: { usedCount: 1 },
            $addToSet: { usedByUsers: userId },
          },
        );
      }

      // 3️⃣ Inventory validation + reduction
      for (const item of cart.items) {
        const inventory = await InventoryModel.findOne({
          productId: item.productId,
        });

        if (!inventory || inventory.quantity < item.quantity) {
          return sendError(
            res,
            CONSTANT_LIST.STATUS_ERROR,
            CONSTANT_LIST.BAD_REQUEST,
            "Insufficient stock.",
          );
        }

        inventory.quantity -= item.quantity;
        await inventory.save();
      }

      // 4️⃣ Create order
      const order = await OrderModel.create({
        orderId: uuidv4(),
        userId,
        items: cart.items,
        totalAmount: cart.bill,
        discount: discountAmount,
        payableAmount: cart.bill - discountAmount,
        couponCode: appliedCouponCode,
        paymentStatus: "PENDING",
        orderStatus: "PENDING",
      });

      // 5️⃣ Fire email worker (non-blocking)
      await emailQueue.add("ORDER_PLACED", {
        orderId: order.orderId,
        userId,
      });

      // 6️⃣ Clear cart
      await CartModel.deleteOne({ cartId });

      return sendSuccess(
        res,
        CONSTANT_LIST.STATUS_SUCCESS,
        CONSTANT_LIST.STATUS_CODE_OK,
        "Order placed successfully",
        order,
      );
    } catch (err: any) {
      console.error("Order placement error:", err);
      return sendError(
        res,
        CONSTANT_LIST.STATUS_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR_MESSAGE,
      );
    }
  },
);

export const getOrderById = asyncHandler(
  async (
    req: express.Request<{}, {}, {}, { orderId: string }>,
    res: express.Response,
  ) => {
    try {
      const orderId = req.query.orderId;
      const order = await OrderModel.findOne({ _id: orderId });
      if (order) {
        return sendSuccess(
          res,
          CONSTANT_LIST.STATUS_SUCCESS,
          CONSTANT_LIST.STATUS_SUCCESS,
          "The order detail",
          order,
        );
      } else {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "Sorry no order found.",
        );
      }
    } catch (err: any) {
      console.error("Error in the apply coupon api:", err);
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
export const listmyOrders = asyncHandler(
  async (
    req: express.Request<{}, {}, {}, productSearchBody>,
    res: express.Response,
  ) => {
    try {
      const user = req.user?.userId;
      const userDetail = await UserModel.findById(user);
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      const sortBy = req.query.sortBy || "createdAt";
      const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
      const orderStatus = req.query.orderStatus;
      //Date filter
      const startDate = req.query?.startDate;
      const endDate = req.query?.endDate;
      //Filters
      const filter: any = {};
      //Normal users can see only their orders
      if (userDetail?.role !== "admin") {
        filter.userId = user;
      }
      //Optional order status filter
      if (orderStatus) {
        filter.orderStatus = orderStatus;
      }

      //Date range logic
      if (startDate || endDate) {
        filter.createdAt = {};
      }
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filter.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createAt.$lte = end;
      }

      const [orders, totalOrder] = await Promise.all([
        OrderModel.aggregate([
          {
            $match: filter,
          },
          {
            $sort: {
              [sortBy]: sortOrder,
            },
          },
          {
            $skip: skip,
          },
          {
            $limit: limit,
          },
        ]),
        OrderModel.countDocuments(filter),
      ]);
      if (orders.length === 0) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.NO_DATA_FOUND,
          "Sorry, no order has been placed.",
        );
      } else {
        return sendSuccess(
          res,
          CONSTANT_LIST.STATUS_SUCCESS,
          CONSTANT_LIST.STATUS_CODE_OK,
          "The order detail",
          {
            orders,
            pagination: {
              totalRecord: totalOrder,
              totalPage: Math.ceil(totalOrder / limit),
              currentPage: page,
              limit,
            },
          },
        );
      }
    } catch (err: any) {
      console.error("Error in order listing api:", err);
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

export const monthlyOrderReport = asyncHandler(
  async (
    req: express.Request<{}, {}, {}, { year: Number }>,
    res: express.Response,
  ) => {
    try {
      const user = req.user?.userId;
      const userDetail = await UserModel.findById(user);
      const year = Number(req.query.year) || new Date().getFullYear();
      const matchStage: any = {
        createdAt: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31T23:59:59:999`),
        },
      };
      if (userDetail?.role !== "admin") {
        matchStage.userId = user;
      }
      const report = await OrderModel.aggregate([
        {
          $match: matchStage,
        },
        {
          $group: {
            _id: {
              month: {
                $month: "$createdAt",
              },
            },
            totalOrder: {
              $sum: 1,
            },
            totalRevenue: {
              $sum: "$payableAmount",
            },
            totalDiscount: {
              $sum: "$discount",
            },
          },
        },
        {
          $sort: {
            "_id.month": 1,
          },
        },
      ]);
      return sendSuccess(
        res,
        CONSTANT_LIST.STATUS_SUCCESS,
        CONSTANT_LIST.STATUS_CODE_OK,
        "Monthly order report generated",
        {
          year,
          report,
        },
      );
    } catch (err: any) {
      console.error("Error in montly listing api:", err);
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

export const yearlyOrderReport = asyncHandler(
  async (
    req: express.Request,
    res: express.Response,
  ): Promise<express.Response> => {
    try {
      const user = req.user?.userId;
      const userDetail = await UserModel.findById(user);
      const matchStage: any = {};
      if (userDetail?.role !== "admin") {
        matchStage.userId = user;
      }

      const report = await OrderModel.aggregate([
        {
          $match: matchStage,
        },
        {
          $group: {
            _id: {
              year: {
                $year: "$createdAt",
              },
            },
            totalOrder: {
              $sum: 1,
            },
            totalRevenue: {
              $sum: "$payableAmount",
            },
            totalDiscount: {
              $sum: "$discount",
            },
          },
        },
        {
          $sort: {
            "_id.year": 1,
          },
        },
        {
          $project: {
            _id: 0,
            year: "$_id.year",
            totalOrders: 1,
            totalRevenue: 1,
            totalDiscount: 1,
          },
        },
      ]);
      return sendSuccess(
        res,
        CONSTANT_LIST.STATUS_SUCCESS,
        CONSTANT_LIST.STATUS_CODE_OK,
        "Monthly order report generated",
        {
          report,
        },
      );
    } catch (err: any) {
      console.error("Error in yearly order listing api:", err);
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

export const updateOrderStatus = asyncHandler(
  async (
    req: express.Request<{}, {}, { status: ORDER_STATUS }, { orderId: string }>,
    res: express.Response,
  ): Promise<express.Response> => {
    try {
      const orderId = req.query.orderId;
      const status = req.body.status;
      const user = req.user?.userId;
      const order = await OrderModel.findById(orderId);
      if (!order) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.NO_DATA_FOUND,
          "Sorry, no product found.",
        );
      }
      if (
        [ORDER_STATUS.CANCELLED, ORDER_STATUS.DELIVERED].includes(
          order.orderStatus,
        )
      ) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          `Order already ${order.orderStatus}`,
        );
      }
      order.orderStatus = status;
      order.statusHistory.push({
        status,
        changedBy: user,
        changedAt: new Date(),
      });
      await order.save();
      return sendSuccess(
        res,
        CONSTANT_LIST.STATUS_SUCCESS,
        CONSTANT_LIST.STATUS_CODE_OK,
        "Order status updated successfully.",
        order,
      );
    } catch (err: any) {
      console.error("Error in update order status api:", err);
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
export const cancelOrder = asyncHandler(
  async (
    req: express.Request<{}, {}, {}, { orderId: string }>,
    res: express.Response,
  ): Promise<express.Response> => {
    try {
      const orderId = req.query.orderId;
      const user = req.user?.userId;
      const order = await OrderModel.findById(orderId);
      if (!order) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.NO_DATA_FOUND,
          "Sorry, no product found.",
        );
      }
      if (
        [ORDER_STATUS.CANCELLED, ORDER_STATUS.DELIVERED].includes(
          order.orderStatus,
        )
      ) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          `Order cannot be cancelled at this stage.`,
        );
      }
      if (order.orderStatus === ORDER_STATUS.CANCELLED) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "Order already cancelled.",
        );
      }
      //----- RESTORE INVENTORY-----------------------------------------------
      for (let item of order.items) {
        const inventory = await InventoryModel.findOne({
          productId: item?.productId,
        });
        if (!inventory) {
          return sendError(
            res,
            CONSTANT_LIST.STATUS_ERROR,
            CONSTANT_LIST.BAD_REQUEST,
            `Inventory not found for product ${item.productId}`,
          );
        }
        inventory.quantity += item.quantity;
        await inventory.save();
      }
      // -------------------- UPDATE ORDER STATUS---------------------------
      order.orderStatus = ORDER_STATUS.CANCELLED;
      order.statusHistory.push({
        status: ORDER_STATUS.CANCELLED,
        changedBy: user,
        changedAt: new Date(),
      });
      return sendSuccess(
        res,
        CONSTANT_LIST.STATUS_SUCCESS,
        CONSTANT_LIST.STATUS_CODE_OK,
        "Order cancelled and inventory restored successfully.",
        null,
      );
    } catch (err: any) {
      console.error("Error in cancel order api:", err);
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

export const gettopSellingProducts = asyncHandler(
  async (
    req: express.Request<{}, {}, {}, productSearchBody>,
    res: express.Response,
  ): Promise<express.Response> => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query?.limit) || 10;
      const skip = (page - 1) * limit;

      const matchStage = {
        paymentStatus: "COMPLETED",
        orderStatus: "DELIVERED",
      };

      const topSellingProduct = await OrderModel.aggregate([
        {
          //Only valid orders
          $match: matchStage,
        },
        //Unwinds items array
        {
          $unwind: "$items",
        },
        {
          $group: {
            _id: "$items.productId",
            totalSoldQuantity: {
              $sum: "$items.quantity",
            },
            totalRevenue: {
              $sum: {
                $multiply: ["$items.quantity", "$items.salePrice"],
              },
            },
          },
        },
        {
          $sort: {
            totalSoldQuantity: -1,
          },
        },
        //Join the product details
        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
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
          $project: {
            _id: 0,
            productId: "$productDetail._id",
            productName: "productDetail.productName",
            productPrice: "$productDetail.salePrice",
            productImages: "$salePrice.productImages",
            totalSoldQuantity: 1,
            totalRevenue: 1,
          },
        },
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
      ]);
      const total = await OrderModel.countDocuments(matchStage);
      if (topSellingProduct.length === 0) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.NO_DATA_FOUND,
          "No product found",
        );
      }
      return sendSuccess(
        res,
        CONSTANT_LIST.STATUS_SUCCESS,
        CONSTANT_LIST.STATUS_CODE_OK,
        "Top selling product fetched",
        {
          topSellingProduct,
          pagination: {
            page,
            limit,
            total,
            totalPage: Math.ceil(total / limit),
          },
        },
      );
    } catch (err: any) {
      console.error("Error in top selling listing product listing api:", err);
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
