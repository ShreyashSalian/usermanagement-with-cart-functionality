import { checkSchema } from "express-validator";
import mongoose from "mongoose";

export const inventoryValidation = () => {
  return checkSchema({
    productId: {
      notEmpty: {
        errorMessage: "Please enter the brand Id.",
      },
      custom: {
        options: (value) => mongoose.Types.ObjectId.isValid(value),
        errorMessage: "Invalid product Id",
      },
    },
    sku: {
      notEmpty: {
        errorMessage: "Please enter the sku.",
      },
    },
    quantity: {
      notEmpty: {
        errorMessage: "Please enter the quantity for the product.",
      },
      isFloat: {
        options: { gt: 0 },
        errorMessage: "Quantity must be greater than 0",
      },
    },
    reservedQuantity: {
      notEmpty: {
        errorMessage: "Please enter the reserved quantity for the product.",
      },
      isFloat: {
        options: { gt: 0 },
        errorMessage: "Reserved quantity must be greater than 0",
      },
    },
    reorderLevel: {
      notEmpty: {
        errorMessage: "Please enter the reorderLevel quantity for the product.",
      },
      isFloat: {
        options: { gt: 0 },
        errorMessage: "ReorderLevel quantity must be greater than 0",
      },
    },
    reorderQuantity: {
      notEmpty: {
        errorMessage:
          "Please enter the reorderQuantity quantity for the product.",
      },
      isFloat: {
        options: { gt: 0 },
        errorMessage: "Reorder Quantity  must be greater than 0",
      },
    },
    warehouseLocation: {
      notEmpty: {
        errorMessage: "Please enter the warehouseLocation.",
      },
    },
    status: {
      notEmpty: {
        errorMessage: "Please enter the status.",
      },
    },
  });
};
