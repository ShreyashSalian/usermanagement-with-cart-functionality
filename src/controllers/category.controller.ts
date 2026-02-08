import express from "express";
import fs from "fs";
import path from "path";
import {
  asyncHandler,
  CustomRequestWithFile,
  sendError,
  sendSuccess,
} from "../utils/function";

import { uploadSingleImage } from "../utils/cloudinarySingleFileUpload";
import { CategoryModel } from "../models/category.model";
import { CONSTANT_LIST } from "../config/global.constants";
import cloudinary from "../config/cloudinary.config";
import { CategoryListQuery } from "../helpers/category.helper";

export const addCategory = asyncHandler(
  async (
    req: express.Request,
    res: express.Response,
  ): Promise<express.Response> => {
    try {
      const customReq = req as CustomRequestWithFile;
      const {
        categoryName,
        categoryDescription,
        categorySlug,
        keywords,
        isFeatured,
      }: {
        categoryName: string;
        categoryDescription: string;
        categorySlug: string;
        keywords: string[];

        isFeatured: boolean;
      } = customReq.body;

      console.log(customReq.file, "-----------------------------------");

      const categoryExist = await CategoryModel.findOne({
        categoryName: categoryName,
      });
      if (categoryExist) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "The category name already exists.",
        );
      }

      const image = await uploadSingleImage(customReq.file);

      const categoryCreation = await CategoryModel.create({
        categoryName,
        categoryDescription,
        categorySlug,
        keywords,
        isFeatured,
        categoryImage: image,
        //  filePath: customReq.file.filename,
      });
      if (categoryCreation) {
        return sendSuccess(
          res,
          CONSTANT_LIST.STATUS_SUCCESS,
          CONSTANT_LIST.STATUS_CODE_OK,
          "Category added successfully",
          categoryCreation,
        );
      } else {
        return sendError(res, 0, 400, "Sorry, the category can not be added.");
      }
    } catch (err: any) {
      console.log(err);
      return sendError(
        res,
        CONSTANT_LIST.STATUS_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR_MESSAGE,
      );
    }
  },
);
export const updateCategory = asyncHandler(
  async (
    req: express.Request<
      {},
      {},
      {
        categoryName: string;
        categoryDescription: string;
        categorySlug: string;
        keywords: string;
        isFeatured: boolean;
      },
      { categoryId: string }
    >,
    res: express.Response,
  ) => {
    try {
      const categoryId = req.query.categoryId;

      const {
        categoryName,
        categoryDescription,
        categorySlug,
        keywords,
        isFeatured,
      } = req.body;
      const categoryExist = await CategoryModel.findOne({
        categoryName: categoryName,
        _id: { $ne: categoryId }, // exclude current category
      });

      if (categoryExist) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "The category name already exists.",
        );
      }
      const categoryUpdate = await CategoryModel.findByIdAndUpdate(
        categoryId,
        {
          $set: {
            categoryName,
            categoryDescription,
            categorySlug,
            keywords,
            isFeatured,
          },
        },
        {
          new: true,
        },
      );
      if (categoryUpdate) {
        return sendSuccess(
          res,
          CONSTANT_LIST.STATUS_SUCCESS,
          CONSTANT_LIST.STATUS_CODE_OK,
          "The category updated",
          categoryUpdate,
        );
      } else {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "Sorry, the status can not be updated",
        );
      }
    } catch (err: any) {
      console.log(`Error in the category update API : ${err}`);
      return sendError(
        res,
        CONSTANT_LIST.STATUS_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR_MESSAGE,
      );
    }
  },
);

export const deleteCategory = asyncHandler(
  async (
    req: express.Request<{}, {}, {}, { categoryId: string }>,
    res: express.Response,
  ) => {
    try {
      const categoryId = req.query.categoryId;
      const category = await CategoryModel.findById(categoryId);
      if (!category) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.NO_DATA_FOUND,
          "No category found",
        );
      }
      const categorySoftUpdate = await CategoryModel.findByIdAndUpdate(
        categoryId,
        {
          $set: {
            isDeleted: true,
          },
        },
      );
      if (!categorySoftUpdate) {
        return sendError(
          res,
          CONSTANT_LIST.BAD_REQUEST,
          CONSTANT_LIST.BAD_REQUEST,
          "Error in updating category",
        );
      } else {
        return sendSuccess(
          res,
          CONSTANT_LIST.STATUS_SUCCESS,
          CONSTANT_LIST.STATUS_CODE_OK,
          "The category deleted successfully",
          null,
        );
      }
    } catch (err: any) {
      console.log(`Error in the category delete API : ${err}`);
      return sendError(
        res,
        CONSTANT_LIST.STATUS_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR_MESSAGE,
      );
    }
  },
);

export const deleteCategoryImage = asyncHandler(
  async (
    req: express.Request<{}, {}, {}, { categoryId: string }>,
    res: express.Response,
  ) => {
    try {
      const categoryId = req.query.categoryId;

      const categoryDetail = await CategoryModel.findById(categoryId);
      if (!categoryDetail) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.NO_DATA_FOUND,
          "The category not found.",
        );
      }

      /* 1️⃣ Delete image from Cloudinary */
      if (categoryDetail.categoryImage?.publicId) {
        await cloudinary.uploader.destroy(
          categoryDetail.categoryImage.publicId,
        );
      }

      /* 2️⃣ Delete local Multer image */
      // if (categoryDetail.filePath) {
      //   const localFilePath = path.join(
      //     process.cwd(),
      //     "public",
      //     "images",
      //     categoryDetail.filePath,
      //   );

      //   if (fs.existsSync(localFilePath)) {
      //     fs.unlinkSync(localFilePath);
      //     console.log("Local image deleted:", localFilePath);
      //   }
      // }

      /* 3️⃣ Clear DB fields */
      categoryDetail.categoryImage = { url: "", publicId: "" };
      categoryDetail.filePath = "";

      /* 4️⃣ Save once */
      await categoryDetail.save();

      return sendSuccess(
        res,
        CONSTANT_LIST.STATUS_SUCCESS,
        CONSTANT_LIST.STATUS_CODE_OK,
        "Category image deleted successfully.",
        {},
      );
    } catch (err: any) {
      console.error("Add category image error:", err);
      return sendError(
        res,
        CONSTANT_LIST.STATUS_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR_MESSAGE,
      );
    }
  },
);

export const updateCategoryImage = asyncHandler(
  async (
    req: express.Request<{}, {}, {}, { categoryId: string }>,
    res: express.Response,
  ) => {
    try {
      const categoryId = req.query.categoryId;
      const file = req.file;

      if (!file) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "Please enter the image.",
        );
      }

      const category = await CategoryModel.findById(categoryId);
      if (!category) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "Category not found.",
        );
      }

      // 1️⃣ Delete old Cloudinary image
      if (category.categoryImage?.publicId) {
        await cloudinary.uploader.destroy(category.categoryImage.publicId);
      }

      // 2️⃣ Upload new image to Cloudinary
      const uploadedImage = await uploadSingleImage(file);

      // 3️⃣ Delete old local image (if exists)
      // if (category.filePath) {
      //   const oldLocalPath = path.join(
      //     process.cwd(),
      //     "public",
      //     "images",
      //     category.filePath,
      //   );

      //   if (fs.existsSync(oldLocalPath)) {
      //     fs.unlinkSync(oldLocalPath);
      //   }
      // }

      // 4️⃣ Save new values
      category.categoryImage = {
        url: uploadedImage.url,
        publicId: uploadedImage.publicId,
      };
      category.filePath = file.filename;

      await category.save();

      return sendSuccess(
        res,
        CONSTANT_LIST.STATUS_SUCCESS,
        CONSTANT_LIST.STATUS_CODE_OK,
        "The category image updated successfully.",
        null,
      );
    } catch (err: any) {
      console.error("Add category image error:", err);
      return sendError(
        res,
        CONSTANT_LIST.STATUS_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR_MESSAGE,
      );
    }
  },
);
export const listAllCategory = asyncHandler(
  async (
    req: express.Request<{}, {}, {}, CategoryListQuery>,
    res: express.Response,
  ) => {
    try {
      /* ---------------- Pagination ---------------- */
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      /* ---------------- Sorting ---------------- */
      const sortBy = req.query?.sortBy || "createdAt";
      const sortOrder = req.query?.sortOrder === "asc" ? 1 : -1;
      /* ---------------- Filters ---------------- */
      const filter: any = {
        isDeleted: false,
      };
      if (req.query?.isFeatured !== undefined) {
        filter.isFeatured = req.query?.isFeatured === "true";
      }

      /* ---------------- Text Search ---------------- */
      if (req.query?.search) {
        filter.$text = { $search: req.query.search };
      }

      console.log(filter, "----------------------------------------");

      const [categories, total] = await Promise.all([
        CategoryModel.find(filter)
          .sort({ [sortBy]: sortOrder })
          .skip(skip)
          .limit(limit)
          .lean(),
        CategoryModel.countDocuments(filter),
      ]);

      if (categories.length === 0) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.NO_DATA_FOUND,
          "Sorry, no category created.",
        );
      } else {
        return sendSuccess(
          res,
          CONSTANT_LIST.STATUS_SUCCESS,
          CONSTANT_LIST.STATUS_CODE_OK,
          "Category list fetched successfully",
          {
            data: categories,
            pagination: {
              totalRecords: total,
              currentPage: page,
              totalPage: Math.ceil(total / limit),
              pagSize: limit,
            },
          },
        );
      }
    } catch (err: any) {
      console.log(`Error in the category list api : ${err}`);
      return sendError(
        res,
        CONSTANT_LIST.STATUS_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR_MESSAGE,
      );
    }
  },
);
