import { checkSchema } from "express-validator";

export const couponValidation = () => {
  return checkSchema({
    code: {
      notEmpty: {
        errorMessage: "Please enter the coupon code.",
      },
      trim: true,
      toUpperCase: true,
    },

    discountType: {
      notEmpty: {
        errorMessage: "Please select the discount type.",
      },
      isIn: {
        options: [["percentage", "fixed"]],
        errorMessage: "Discount type must be percentage or fixed.",
      },
    },

    minCartValue: {
      notEmpty: {
        errorMessage: "Minimum cart value is required.",
      },
      isFloat: {
        options: { min: 0 },
        errorMessage: "Minimum cart value must be a positive number.",
      },
    },

    startDate: {
      notEmpty: {
        errorMessage: "Start date is required.",
      },
      isISO8601: {
        errorMessage: "Start date must be a valid date.",
      },
      custom: {
        options: (value) => {
          const startDate = new Date(value);
          const today = new Date();

          // Remove time for accurate comparison
          today.setHours(0, 0, 0, 0);

          if (startDate < today) {
            throw new Error("Start date cannot be in the past.");
          }

          return true;
        },
      },
    },

    endDate: {
      notEmpty: {
        errorMessage: "End date is required.",
      },
      isISO8601: {
        errorMessage: "End date must be a valid date.",
      },
      custom: {
        options: (value, { req }) => {
          const startDate = new Date(req.body.start_date);
          const endDate = new Date(value);

          if (endDate < startDate) {
            throw new Error("End date cannot be before start date.");
          }

          return true;
        },
      },
    },
    isActive: {
      notEmpty: {
        errorMessage: "Please select the status of coupon.",
      },
    },
  });
};
