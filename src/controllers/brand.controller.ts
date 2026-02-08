import express from "express";

import {
  asyncHandler,
  CustomRequestWithFile,
  sendError,
  sendSuccess,
} from "../utils/function";

import { uploadSingleImage } from "../utils/cloudinarySingleFileUpload";

import { CONSTANT_LIST } from "../config/global.constants";
import cloudinary from "../config/cloudinary.config";
import { BrandModel } from "../models/brand.model";
import { CategoryListQuery } from "../helpers/category.helper";

export const addBrand = asyncHandler(
  async (
    req: express.Request,
    res: express.Response,
  ): Promise<express.Response> => {
    try {
      const customReq = req as CustomRequestWithFile;
      const {
        brandName,
        brandDescription,
        keywords,
        isFeatured,
      }: {
        brandName: string;
        brandDescription: string;
        keywords: string[];
        isFeatured: boolean;
      } = customReq.body;

      console.log(customReq.file, "-----------------------------------");
      const image = await uploadSingleImage(customReq.file);

      const brandCreation = await BrandModel.create({
        brandName,
        brandDescription,
        keywords,
        isFeatured,
        brandImage: image,
        //  filePath: customReq.file.filename,
      });
      if (brandCreation) {
        return sendSuccess(
          res,
          CONSTANT_LIST.STATUS_SUCCESS,
          CONSTANT_LIST.STATUS_CODE_OK,
          "Brand added successfully",
          brandCreation,
        );
      } else {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "Sorry, the brand can not be created.",
        );
      }
    } catch (err: any) {
      console.log(`Error in the brand creation API : ${err}`);
      return sendError(
        res,
        CONSTANT_LIST.STATUS_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR_MESSAGE,
      );
    }
  },
);
export const updateBrand = asyncHandler(
  async (
    req: express.Request<
      {},
      {},
      {
        brandName: string;
        brandDescription: string;
        keywords: string[];
        isFeatured: boolean;
      },
      { brandId: string }
    >,
    res: express.Response,
  ): Promise<express.Response> => {
    try {
      const brandId = req.query.brandId;
      const { brandName, brandDescription, keywords, isFeatured } = req.body;
      const brand = await BrandModel.findById(brandId);
      if (!brand) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.NO_DATA_FOUND,
          "Sorry, no brand found",
        );
      }
      const brandUpdation = await BrandModel.findByIdAndUpdate(
        brandId,
        {
          $set: {
            brandName,
            brandDescription,
            keywords,
            isFeatured,
          },
        },
        {
          new: true,
        },
      );
      if (brandUpdation) {
        return sendSuccess(
          res,
          CONSTANT_LIST.STATUS_SUCCESS,
          CONSTANT_LIST.STATUS_CODE_OK,
          "The category updated successfully.",
          brandUpdation,
        );
      } else {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "Error in updating category.",
        );
      }
    } catch (err: any) {
      console.log(`Error in the brand creation API : ${err}`);
      return sendError(
        res,
        CONSTANT_LIST.STATUS_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR_MESSAGE,
      );
    }
  },
);

export const deleteBrand = asyncHandler(
  async (
    req: express.Request<{}, {}, {}, { brandId: string }>,
    res: express.Response,
  ) => {
    try {
      const brandId = req.query.brandId;
      const brand = await BrandModel.findById(brandId);
      if (!brand) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.NO_DATA_FOUND,
          "No brand found.",
        );
      }
      const brandSoftUpdate = await BrandModel.findByIdAndUpdate(brandId, {
        $set: {
          isDeleted: true,
        },
      });
      if (!brandSoftUpdate) {
        return sendError(
          res,
          CONSTANT_LIST.BAD_REQUEST,
          CONSTANT_LIST.BAD_REQUEST,
          "Error in deleting brand.",
        );
      } else {
        return sendSuccess(
          res,
          CONSTANT_LIST.STATUS_SUCCESS,
          CONSTANT_LIST.STATUS_CODE_OK,
          "The brand deleted successfully",
          null,
        );
      }
    } catch (err: any) {
      console.log(`Error in the brand delete API : ${err}`);
      return sendError(
        res,
        CONSTANT_LIST.STATUS_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR_MESSAGE,
      );
    }
  },
);

export const deleteBrandImage = asyncHandler(
  async (
    req: express.Request<{}, {}, {}, { brandId: string }>,
    res: express.Response,
  ) => {
    try {
      const brandId = req.query.brandId;
      const brandDetail = await BrandModel.findById(brandId);
      if (!brandDetail) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.NO_DATA_FOUND,
          "The brand not found.",
        );
      }

      /* 1️⃣ Delete image from Cloudinary */
      if (brandDetail.brandImage?.publicId) {
        await cloudinary.uploader.destroy(brandDetail.brandImage?.publicId);
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
      brandDetail.brandImage = { url: "", publicId: "" };

      /* 4️⃣ Save once */
      await brandDetail.save();

      return sendSuccess(
        res,
        CONSTANT_LIST.STATUS_SUCCESS,
        CONSTANT_LIST.STATUS_CODE_OK,
        "Brand image deleted successfully.",
        {},
      );
    } catch (err: any) {
      console.error("Error in the delete category image", err);
      return sendError(
        res,
        CONSTANT_LIST.STATUS_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR_MESSAGE,
      );
    }
  },
);

export const updateBrandImage = asyncHandler(
  async (
    req: express.Request<{}, {}, {}, { brandId: string }>,
    res: express.Response,
  ) => {
    try {
      const brandId = req.query.brandId;
      const file = req.file;

      if (!file) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "Please enter the image.",
        );
      }

      const brand = await BrandModel.findById(brandId);
      if (!brand) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "Category not found.",
        );
      }

      // 1️⃣ Delete old Cloudinary image
      if (brand.brandImage?.publicId) {
        await cloudinary.uploader.destroy(brand.brandImage.publicId);
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
      brand.brandImage = {
        url: uploadedImage.url,
        publicId: uploadedImage.publicId,
      };
      brand.filePath = file.filename;

      await brand.save();

      return sendSuccess(
        res,
        CONSTANT_LIST.STATUS_SUCCESS,
        CONSTANT_LIST.STATUS_CODE_OK,
        "The brand image updated successfully.",
        null,
      );
    } catch (err: any) {
      console.error("update brand image error:", err);
      return sendError(
        res,
        CONSTANT_LIST.STATUS_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR_MESSAGE,
      );
    }
  },
);
export const listAllBrand = asyncHandler(
  async (
    req: express.Request<{}, any, any, CategoryListQuery>,
    res: express.Response,
  ) => {
    try {
      //--------------------Pagination------------------------
      const page = Number(req.query?.page) || 1;
      const limit = Number(req.query?.limit) || 10;
      const skip = Number(page - 1) * limit;

      //------------------ Sorting ----------------------------
      const sortBy = req.query?.sortBy || "createdAt";
      const sortOrder = req.query?.sortOrder === "asc" ? 1 : -1;

      //------------------- Filter----------------------------
      const filter: any = {
        isDeleted: false,
      };
      if (req.query?.isFeatured !== undefined) {
        filter.isFeatured = req.query?.isFeatured === "true";
      }
      //-------------------- Text Search----------------------
      if (req.query?.search) {
        filter.$text = { $search: req.query?.search };
      }
      const [brandDetail, total] = await Promise.all([
        BrandModel.find(filter)
          .sort({ [sortBy]: sortOrder })
          .skip(skip)
          .limit(limit)
          .lean(),
        BrandModel.countDocuments(filter),
      ]);

      if (brandDetail.length === 0) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.NO_DATA_FOUND,
          "No brand found.",
        );
      } else {
        return sendSuccess(
          res,
          CONSTANT_LIST.STATUS_SUCCESS,
          CONSTANT_LIST.STATUS_CODE_OK,
          "brand list fetched successfully",
          {
            data: brandDetail,
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
      console.log(`Error in the brand listing api : ${err}`);
      return sendError(
        res,
        CONSTANT_LIST.STATUS_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR_MESSAGE,
      );
    }
  },
);
