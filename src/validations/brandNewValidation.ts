import { checkSchema, Meta } from "express-validator";
import { allowedMimeTypes, deleteFile, maxSize } from "../utils/function";
export const brandNewValidation = () => {
  return checkSchema({
    brandName: {
      notEmpty: {
        errorMessage: "Please enter the brand name.",
      },
    },
    brandDescription: {
      notEmpty: {
        errorMessage: "Please enter the brand description.",
      },
    },
    isFeatured: {
      notEmpty: {
        errorMessage: "Select feature option",
      },
    },
    keywords: {
      isArray: {
        errorMessage: "keywords must be an array.",
      },
      custom: {
        options: (value: any[]) => {
          if (!value || value.length === 0) {
            throw new Error("Please provide at least one keyword.");
          }
          return true;
        },
      },
    },
  });
};
