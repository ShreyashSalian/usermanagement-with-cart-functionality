import { checkSchema, Meta } from "express-validator";
import { allowedMimeTypes, deleteFile, maxSize } from "../utils/function";
export const categoryValidation = () => {
  return checkSchema({
    categoryName: {
      notEmpty: {
        errorMessage: "Please enter the category name.",
      },
    },
    categoryDescription: {
      notEmpty: {
        errorMessage: "Please enter the category description.",
      },
    },
    categorySlug: {
      notEmpty: {
        errorMessage: "Plesae enter the category slug",
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
    isFeatured: {
      notEmpty: {
        errorMessage: "Select feature option",
      },
    },
    // categoryImage: {
    //   custom: {
    //     options: (value: unknown, { req }: Meta) => {
    //       const file = (req.file as Express.Multer.File) || null;

    //       // Skip validation if no file is uploaded
    //       if (!file) {
    //         return true;
    //       }

    //       // Check MIME type
    //       if (!allowedMimeTypes.includes(file.mimetype)) {
    //         deleteFile(file);
    //         throw new Error("Only .jpeg and .png formats are allowed.");
    //       }

    //       // Check file size
    //       if (file.size > maxSize) {
    //         deleteFile(file);
    //         throw new Error("Image size should not exceed 2MB.");
    //       }

    //       return true; // Validation passes
    //     },
    //   },
    // },
    categoryImage: {
      custom: {
        options: (value: unknown, { req }: Meta) => {
          if (!req.file) {
            throw new Error("Category image is required");
          }
          const file = req.file as Express.Multer.File;
          if (!allowedMimeTypes.includes(file.mimetype)) {
            deleteFile(file);
            throw new Error("Only .jpeg and .png formats are allowed.");
          }
          if (file.size > maxSize) {
            deleteFile(file);
            throw new Error("Image size should not exceed 2MB.");
          }
          return true;
        },
      },
    },
  });
};
