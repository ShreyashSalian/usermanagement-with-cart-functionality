import { checkSchema, Meta } from "express-validator";

export const categoryNewValidation = () => {
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
  });
};
