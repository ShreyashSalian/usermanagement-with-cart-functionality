import { checkSchema, Meta } from "express-validator";
import fs from "fs";

import { trimInput } from "../utils/function";
import mongoose from "mongoose";

export const productValidator = () => {
  return checkSchema({
    productName: {
      notEmpty: {
        errorMessage: "Please enter the product name.",
      },
      customSanitizer: {
        options: trimInput,
      },
    },
    productSlug: {
      notEmpty: {
        errorMessage: "Please enter the product slug.",
      },
    },
    categoryId: {
      notEmpty: {
        errorMessage: "Please enter the category Id.",
      },
      custom: {
        options: (value) => mongoose.Types.ObjectId.isValid(value),
        errorMessage: "Invalid category Id",
      },
    },
    brandId: {
      notEmpty: {
        errorMessage: "Please enter the brand Id.",
      },
      custom: {
        options: (value) => mongoose.Types.ObjectId.isValid(value),
        errorMessage: "Invalid brand Id",
      },
    },
    price: {
      notEmpty: {
        errorMessage: "Please enter the price for the product.",
      },
      isFloat: {
        options: { gt: 0 },
        errorMessage: "Price must be greater than 0",
      },
    },
    // quantity: {
    //   notEmpty: {
    //     errorMessage: "Please enter the quantity for the product.",
    //   },
    //   isFloat: {
    //     options: { gt: 0 },
    //     errorMessage: "Quantity must be greater than 0",
    //   },
    // },
    isFeatured: {
      notEmpty: {
        errorMessage: "Please select whether the product is featured or not.",
      },
    },

    productImages: {
      custom: {
        options: (value: any, { req }: { req: any }) => {
          if (!Array.isArray(req.files) || req.files.length === 0) {
            throw new Error("Please upload at least one product image.");
          }

          const allowedMimeTypes = ["image/jpeg", "image/png"];
          (req.files as Express.Multer.File[]).forEach((file) => {
            if (!allowedMimeTypes.includes(file.mimetype)) {
              (req.files as Express.Multer.File[]).forEach((f) =>
                fs.unlinkSync(f.path),
              );
              throw new Error("Only .jpeg and .png formats are allowed.");
            }
            if (file.size > 3 * 1024 * 1024) {
              (req.files as Express.Multer.File[]).forEach((f) =>
                fs.unlinkSync(f.path),
              );
              throw new Error("Image size should not exceed 3MB.");
            }
          });
          return true;
        },
      },
    },
  });
};
