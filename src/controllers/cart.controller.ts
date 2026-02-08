import express from "express";
import { asyncHandler, sendError, sendSuccess } from "../utils/function";
import { CONSTANT_LIST } from "../config/global.constants";
import { v4 as uuidv4 } from "uuid";
import { ProductModel } from "../models/product.model";
import { InventoryModel } from "../models/inventory.model";
import { CartModel, itemFields } from "../models/cart.model";
import mongoose from "mongoose";
import { CouponModel } from "../models/coupon.model";

export const addItem = asyncHandler(
  async (
    req: express.Request<
      {},
      {},
      { productId: string; quantity: number; cartId: string }
    >,
    res: express.Response,
  ): Promise<express.Response> => {
    try {
      const { productId, quantity, cartId } = req.body;
      const product = await ProductModel.findById(productId);
      if (!product) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.NO_DATA_FOUND,
          "Sorry, no product found",
        );
      }
      const inventory = await InventoryModel.findOne({ productId: productId });
      if (!inventory || inventory?.quantity < quantity) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "Not enough stock.",
        );
      }
      let cart = await CartModel.findOne({ cartId });
      let newPrice;
      if (product?.salePrice) {
        newPrice = product.salePrice;
      } else {
        newPrice = product.price;
      }
      if (cart) {
        const index = cart?.items.findIndex(
          (p) => p.productId.toString() === productId,
        );
        if (index > -1) {
          cart.items[index].quantity += quantity;
          if (product.salePrice) {
            cart.items[index].totalPrice = product?.salePrice * quantity;
          }
          cart.items[index].totalPrice = product.price * quantity;
        } else {
          const newItems: itemFields = {
            productId: new mongoose.Types.ObjectId(productId),
            productName: product?.productName,
            quantity: quantity,
            price: newPrice,
            totalPrice: newPrice * quantity,
          };
          cart.items.push(newItems);
        }
      } else {
        cart = new CartModel({
          cartId: uuidv4(),
          items: [
            {
              productId: productId,
              productName: product?.productName,
              quantity: quantity,
              price: newPrice,
              totalPrice: newPrice * quantity,
            },
          ],
        });
      }
      cart.bill = cart.items.reduce((a, b) => a + b.totalPrice, 0);
      await cart.save();
      return sendSuccess(
        res,
        CONSTANT_LIST.STATUS_SUCCESS,
        CONSTANT_LIST.STATUS_CODE_CREATED,
        "Item added to cart",
        cart,
      );
    } catch (err: any) {
      console.error("Error in the get add item to cart api:", err);
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

export const deleteItem = asyncHandler(
  async (
    req: express.Request<{}, {}, { productId: string; cartId: string }>,
    res: express.Response,
  ) => {
    try {
      const { cartId, productId } = req.body;
      const product = await ProductModel.findById(productId);
      if (!product) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.NO_DATA_FOUND,
          "Sorry, no product found",
        );
      }

      const cart = await CartModel.findOne({ cartId });
      if (!cart) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "Sorry,no cart found.",
        );
      }
      cart.items = cart.items.filter(
        (p) => p.productId.toString() !== productId,
      );
      cart.bill = cart?.items.reduce((a, b) => a + b.totalPrice, 0);
      await cart.save();
      return sendSuccess(
        res,
        CONSTANT_LIST.STATUS_SUCCESS,
        CONSTANT_LIST.STATUS_CODE_OK,
        "The product deleted from cart",
        cart,
      );
    } catch (err: any) {
      console.error("Error in the delete item to cart api:", err);
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
export const updateItem = asyncHandler(
  async (
    req: express.Request<
      {},
      {},
      { productId: string; quantity: number; cartId: string }
    >,
    res: express.Response,
  ) => {
    try {
      const { cartId, quantity, productId } = req.body;
      const product = await ProductModel.findById(productId);
      if (!product) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.NO_DATA_FOUND,
          "Sorry, no product found",
        );
      }
      const inventory = await InventoryModel.findOne({ productId: productId });
      if (!inventory || inventory?.quantity < quantity) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "Not enough stock.",
        );
      }
      const cart = await CartModel.findOne({ cartId });
      if (!cart) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "Sorry,no cart found.",
        );
      }
      let newPrice;
      if (product?.salePrice) {
        newPrice = product.salePrice;
      } else {
        newPrice = product.price;
      }
      const index = cart.items.findIndex(
        (p) => p.productId.toString() === productId,
      );
      if (index === -1) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "Sorry, no product found",
        );
      }
      const items = cart.items[index];
      items.quantity = quantity;
      ((items.price = newPrice), (items.totalPrice = newPrice * quantity));
      cart.bill = cart.items.reduce((a, b) => a + b.totalPrice, 0);
      await cart.save();
      return sendSuccess(
        res,
        CONSTANT_LIST.STATUS_SUCCESS,
        CONSTANT_LIST.STATUS_CODE_OK,
        "The item updated",
        cart,
      );
    } catch (err: any) {
      console.error("Error in the delete item to cart api:", err);
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

export const applyCoupon = asyncHandler(
  async (
    req: express.Request<{}, {}, { couponCode: string; cartId: string }>,
    res: express.Response,
  ) => {
    try {
      const { couponCode, cartId } = req.body;
      const cart = await CartModel.findById(cartId);
      if (!cart) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.NO_DATA_FOUND,
          "Sorry, no cart found",
        );
      }
      if (cart?.couponCode === couponCode) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "Coupon already applied.",
        );
      }
      const coupon = await CouponModel.findOne({
        code: couponCode?.toUpperCase(),
        isActive: true,
      });
      if (!coupon) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.NO_DATA_FOUND,
          "Invalid or inactive coupon.",
        );
      }
      const now = new Date();
      //------------Start date validation--------------------------------------
      if (coupon?.startDate > now) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "Coupon is not active yet.",
        );
      }
      if (coupon.endDate < now) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "Coupon has expired.",
        );
      }

      //--------- check for usage limit---------------------------------------
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "Coupon usage limit execeeded.",
        );
      }
      //----------------Check for minimum value-------------------------------
      if (cart.bill < coupon?.minCartValue) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          `Minimum cart value should be ₹${coupon.minCartValue}`,
        );
      }
      //----------------------- Discount calculation------------------------------
      let discountAmount = 0;
      if (coupon.discountType === "percentage") {
        discountAmount = (cart.bill * coupon.discountValue) / 100;
      }
      if (coupon.discountType === "fixed") {
        discountAmount = Number(coupon.discountValue);
      } else {
        discountAmount = coupon.maxDiscount;
      }
      cart.couponCode = coupon.code;
      cart.discount = discountAmount;
      cart.payableAmount = cart.bill = discountAmount;
      await cart.save();
      return sendSuccess(
        res,
        CONSTANT_LIST.STATUS_SUCCESS,
        CONSTANT_LIST.STATUS_CODE_OK,
        "Coupon applied successfully",
        cart,
      );
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
