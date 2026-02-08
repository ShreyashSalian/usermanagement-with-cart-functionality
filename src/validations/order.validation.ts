import { checkSchema } from "express-validator";
import { ORDER_STATUS } from "../models/order.model";

export const updateOrderStatusValidation = () => {
  return checkSchema({
    status: {
      notEmpty: {
        errorMessage: "Order status is required.",
      },
      isIn: {
        options: [Object.values(ORDER_STATUS)],
        errorMessage: "Invalid order status.",
      },
    },
  });
};
