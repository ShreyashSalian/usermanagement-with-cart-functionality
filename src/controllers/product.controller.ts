import express from "express";
import path from "path";
import fs from "fs";
import {
  asyncHandler,
  CustomRequestWithFiles,
  sendError,
  sendSuccess,
} from "../utils/function";
import { uploadMultipleImages } from "../utils/cloudinaryMultipleFileUpload";
import { ProductModel } from "../models/product.model";
import { CONSTANT_LIST } from "../config/global.constants";
import mongoose from "mongoose";
import { CategoryModel } from "../models/category.model";
import { BrandModel } from "../models/brand.model";
import { InventoryModel } from "../models/inventory.model";
import cloudinary from "../config/cloudinary.config";
import {
  allowedSortFields,
  productSearchBody,
} from "../helpers/category.helper";

export const addProduct = asyncHandler(
  async (req: express.Request, res: express.Response) => {
    try {
      const customRequest = req as CustomRequestWithFiles;
      const {
        productName,
        productDescription,
        productSlug,
        price,
        salePrice,
        categoryId,
        brandId,
        isFeatured,
      }: {
        productName: string;
        productDescription: string;
        productSlug: string;
        price: number;
        salePrice: number;
        categoryId: string;
        brandId: string;
        isFeatured: boolean;
      } = req.body;
      console.log(
        salePrice,
        "===========================================",
        price,
      );
      const priceNum = Number(price);
      const salePriceNum = Number(salePrice);
      if (!customRequest.files || customRequest.files.length === 0) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.VALIDATION_ERROR,
          "Please upload at least one product image.",
        );
      }
      if (salePriceNum && salePriceNum >= priceNum) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "Sale price must be less than product price",
        );
      }
      const categoryExists = await CategoryModel.findOne({ _id: categoryId });

      if (!categoryExists) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "Invalid category selected",
        );
      }
      const brandExists = await BrandModel.findOne({ _id: brandId });
      if (!brandExists) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "Invalid brand selected",
        );
      }

      //Upload product image to cloudinary
      const productImagesList = await uploadMultipleImages(customRequest.files);

      //Create the product.
      const product = await ProductModel.create({
        productName,
        productDescription,
        productSlug,
        price: priceNum,
        salePrice: salePriceNum,
        categoryId,
        brandId,
        productImages: productImagesList,
        isFeatured,
      });

      //commit transactio
      return sendSuccess(
        res,
        CONSTANT_LIST.STATUS_SUCCESS,
        CONSTANT_LIST.STATUS_CODE_OK,
        "The product added successfully",
        product,
      );
    } catch (err: any) {
      // // Cleanup uploaded files in case of error
      // if ((req as CustomRequestWithFiles).files) {
      //   (req as CustomRequestWithFiles).files.forEach((file) => {
      //     if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      //   });
      // }
      console.error("Error in add product API:", err);
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
export const updateProduct = asyncHandler(
  async (
    req: express.Request<
      {},
      {},
      {
        productName: string;
        productDescription: string;
        productSlug: string;
        price: number;
        salePrice: number;
        categoryId: string;
        brandId: string;
        isFeatured: boolean;
      },
      { productId: string }
    >,
    res: express.Response,
  ) => {
    try {
      const {
        productName,
        productDescription,
        productSlug,
        price,
        salePrice,
        categoryId,
        brandId,
        isFeatured,
      } = req.body;

      const productId = req.query.productId;
      console.log(productId, "--------------------------");
      const priceNum = Number(price);
      const salePriceNum = Number(salePrice);

      if (salePriceNum && salePriceNum >= priceNum) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "Sale price must be less than product price",
        );
      }
      const categoryExists = await CategoryModel.findOne({ _id: categoryId });

      if (!categoryExists) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "Invalid category selected",
        );
      }
      const brandExists = await BrandModel.findOne({ _id: brandId });
      if (!brandExists) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "Invalid brand selected",
        );
      }

      const findProductAndUpdate = await ProductModel.findByIdAndUpdate(
        productId,
        {
          $set: {
            productName,
            productDescription,
            productSlug,
            price: priceNum,
            salePrice: salePriceNum,
            categoryId,
            brandId,
            isFeatured,
          },
        },
        {
          new: true,
        },
      );
      if (findProductAndUpdate) {
        return sendSuccess(
          res,
          CONSTANT_LIST.STATUS_SUCCESS,
          CONSTANT_LIST.STATUS_CODE_OK,
          "The product updated successfully",
          findProductAndUpdate,
        );
      } else {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "Sorry, the product can not updated.",
        );
      }
    } catch (err: any) {
      // // Cleanup uploaded files in case of error
      // if ((req as CustomRequestWithFiles).files) {
      //   (req as CustomRequestWithFiles).files.forEach((file) => {
      //     if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      //   });
      // }
      console.error("Error in add product API:", err);
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
// export const addProduct = asyncHandler(
//   async (req: express.Request, res: express.Response) => {
//     try {
//       const customRequest = req as CustomRequestWithFiles;
//       const {
//         productName,
//         productDescription,
//         productQuantity,
//         productPrice,
//         productCategory,
//       }: {
//         productName: string;
//         productDescription: string;
//         productQuantity: number;
//         productPrice: number;
//         productCategory: string;
//       } = req.body;

//       // const productImages: string[] | null =
//       //   customRequest.files && Array.isArray(customRequest.files)
//       //     ? customRequest.files.map((file) => file.filename)
//       //     : null;

//       if (!customRequest.files || customRequest.files.length === 0) {
//         return sendError(
//           res,
//           CONSTANT_LIST.STATUS_ERROR,
//           CONSTANT_LIST.BAD_REQUEST,
//           "Images are required",
//         );
//       }

//       //Push job to bullmq
//       await productQueue.add(
//         "add-product",
//         {
//           productName,
//           productDescription,
//           productQuantity,
//           productPrice,
//           productCategory,
//           files: customRequest.files.map((file) => ({
//             path: file.path, // ✅ IMPORTANT
//             filename: file.filename,
//           })),
//         },
//         {
//           removeOnComplete: true,
//           attempts: 3,
//           backoff: { type: "exponential", delay: 2000 },
//         },
//       );
//       return sendSuccess(
//         res,
//         CONSTANT_LIST.STATUS_SUCCESS,
//         CONSTANT_LIST.STATUS_CODE_OK,
//         "The product added successfully",
//         {},
//       );
//     } catch (err: any) {
//       console.log(`Error in the add product api : ${err}`);
//       return sendError(
//         res,
//         CONSTANT_LIST.STATUS_ERROR,
//         CONSTANT_LIST.INTERNAL_SERVER_ERROR,
//         CONSTANT_LIST.INTERNAL_SERVER_ERROR_MESSAGE,
//       );
//     }
//   },
// );
// export const deleteProductImages = asyncHandler(
//   async (
//     req: express.Request<{ productId: string }, {}, { publicIds: string[] }>,
//     res: express.Response,
//   ) => {
//     try {
//       const productId = req.params.productId;
//       const publicIds = req.body.publicIds;

//       if (!Array.isArray(publicIds) || publicIds.length === 0) {
//         return sendError(
//           res,
//           CONSTANT_LIST.STATUS_ERROR,
//           CONSTANT_LIST.BAD_REQUEST,
//           "Public id array is required.",
//         );
//       }
//       const product = await ProductModel.findById(productId);
//       if (!product) {
//         return sendError(
//           res,
//           CONSTANT_LIST.STATUS_ERROR,
//           CONSTANT_LIST.NO_CONTENT_FOUND,
//           "Sorry, no product found.",
//         );
//       }
//       for (const publicId of publicIds) {
//         const imageIndex = product.productImages.findIndex((img) => {
//           img.publicId === publicId;
//         });
//         if (imageIndex === -1) continue;
//         //Delete from cloudinary
//         await cloudinary.uploader.destroy(publicId);
//         //Delete from localfile
//         const localfile = product?.filePath?.[imageIndex];
//         if (localfile) {
//           const fullPath = path.join(
//             process.cwd(),
//             "public",
//             "images",
//             localfile,
//           );
//           if (fs.existsSync(fullPath)) {
//             fs.unlinkSync(fullPath);
//           }
//         }
//         //Remove from arrays
//         product.productImages.splice(imageIndex, 1);
//         product.filePath.splice(imageIndex, 1);
//       }
//       await product.save();
//       return sendSuccess(
//         res,
//         CONSTANT_LIST.STATUS_SUCCESS,
//         CONSTANT_LIST.STATUS_CODE_OK,
//         "Selected product images deleted successfully",
//         {},
//       );
//     } catch (err: any) {
//       console.log(`Error in the delete product Images api : ${err}`);
//       return sendError(
//         res,
//         CONSTANT_LIST.STATUS_ERROR,
//         CONSTANT_LIST.INTERNAL_SERVER_ERROR,
//         CONSTANT_LIST.INTERNAL_SERVER_ERROR_MESSAGE,
//       );
//     }
//   },
// );

// export const addNewProductImages = asyncHandler(
//   async (
//     req: express.Request<{ productId: string }>,
//     res: express.Response,
//   ) => {
//     try {
//       const productId = req.params.productId;
//       const customRequest = req as CustomRequestWithFiles;
//       if (!customRequest.files || customRequest.files.length === 0) {
//         return sendError(
//           res,
//           CONSTANT_LIST.STATUS_ERROR,
//           CONSTANT_LIST.BAD_REQUEST,
//           "No image uploaded.",
//         );
//       }
//       const product = await Product.findById(productId);
//       if (!product) {
//         return sendError(
//           res,
//           CONSTANT_LIST.STATUS_ERROR,
//           CONSTANT_LIST.NO_CONTENT_FOUND,
//           "Product not found",
//         );
//       }
//       //Upload new images to cloudinary
//       const uploadImages = await uploadMultipleImages(customRequest.files);
//       //Append keep old and add new one
//       product.productImages.push(...uploadImages);
//       product.filePath.push(...customRequest.files.map((f) => f.filename));
//       await product.save();
//       return sendSuccess(
//         res,
//         CONSTANT_LIST.STATUS_SUCCESS,
//         CONSTANT_LIST.STATUS_CODE_OK,
//         "The product images has been added successfully",
//         {},
//       );
//     } catch (err: any) {
//       console.log(`Error in the adding the images for the product api ${err}`);
//       return sendError(
//         res,
//         CONSTANT_LIST.STATUS_ERROR,
//         CONSTANT_LIST.INTERNAL_SERVER_ERROR,
//         CONSTANT_LIST.INTERNAL_SERVER_ERROR_MESSAGE,
//       );
//     }
//   },
// );

// export const deleteAllProductImages = asyncHandler(
//   async (
//     req: express.Request<{ productId: string }>,
//     res: express.Response,
//   ) => {
//     try {
//       const product = await Product.findById(req.params.productId);
//       if (!product) {
//         return sendError(res, 0, 404, "Product not found");
//       }

//       // 1️⃣ Delete images from Cloudinary
//       for (const img of product.productImages) {
//         if (img.publicId) {
//           await cloudinary.uploader.destroy(img.publicId);
//         }
//       }

//       // 2️⃣ Delete images from Multer (local storage)
//       for (const file of product.filePath) {
//         const fullPath = path.join(process.cwd(), "public", "images", file);

//         if (fs.existsSync(fullPath)) {
//           fs.unlinkSync(fullPath);
//         }
//       }

//       // 3️⃣ Clear arrays
//       product.productImages = [];
//       product.filePath = [];

//       await product.save();

//       return sendSuccess(
//         res,
//         1,
//         200,
//         "All product images deleted successfully",
//         {},
//       );
//     } catch (err) {
//       console.error("Delete All Product Images Error:", err);
//       return sendError(res, 0, 500, "Failed to delete product images");
//     }
//   },
// );

export const deleteProduct = asyncHandler(
  async (
    req: express.Request<{}, {}, {}, { productId: string }>,
    res: express.Response,
  ) => {
    try {
      const productId = req.query.productId;

      const findProductAndUpdate = await ProductModel.findByIdAndUpdate(
        productId,
        {
          $set: {
            isDeleted: true,
          },
        },
      );
      if (findProductAndUpdate) {
        return sendSuccess(
          res,
          CONSTANT_LIST.STATUS_SUCCESS,
          CONSTANT_LIST.STATUS_CODE_OK,
          "The product deleted successfully",
          null,
        );
      } else {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "Sorry, the product can not deleted.",
        );
      }
    } catch (err: any) {
      // // Cleanup uploaded files in case of error
      // if ((req as CustomRequestWithFiles).files) {
      //   (req as CustomRequestWithFiles).files.forEach((file) => {
      //     if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      //   });
      // }
      console.error("Error in add product API:", err);
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

export const deleteProductImages = asyncHandler(
  async (
    req: express.Request<{ productId: string }, {}, { publicIds: string[] }>,
    res: express.Response,
  ) => {
    try {
      const productId = req.params.productId;
      const publicIds = req.body.publicIds;

      if (!Array.isArray(publicIds) || publicIds.length === 0) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "Public id array is required.",
        );
      }
      const product = await ProductModel.findById(productId);
      if (!product) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.NO_CONTENT_FOUND,
          "Sorry, no product found.",
        );
      }
      for (const publicId of publicIds) {
        const imageIndex = product.productImages.findIndex((img) => {
          img.publicId === publicId;
        });
        if (imageIndex === -1) continue;
        //Delete from cloudinary
        await cloudinary.uploader.destroy(publicId);
        //Delete from localfile
        // const localfile = product?.filePath?.[imageIndex];
        // if (localfile) {
        //   const fullPath = path.join(
        //     process.cwd(),
        //     "public",
        //     "images",
        //     localfile,
        //   );
        //   if (fs.existsSync(fullPath)) {
        //     fs.unlinkSync(fullPath);
        //   }
        // }
        //Remove from arrays
        product.productImages.splice(imageIndex, 1);
        // product.filePath.splice(imageIndex, 1);
      }
      await product.save();
      return sendSuccess(
        res,
        CONSTANT_LIST.STATUS_SUCCESS,
        CONSTANT_LIST.STATUS_CODE_OK,
        "Selected product images deleted successfully",
        {},
      );
    } catch (err: any) {
      console.log(`Error in the delete product Images api : ${err}`);
      return sendError(
        res,
        CONSTANT_LIST.STATUS_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR_MESSAGE,
      );
    }
  },
);

export const addNewProductImages = asyncHandler(
  async (
    req: express.Request<{ productId: string }>,
    res: express.Response,
  ) => {
    try {
      const productId = req.params.productId;
      const customRequest = req as CustomRequestWithFiles;
      if (!customRequest.files || customRequest.files.length === 0) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "No image uploaded.",
        );
      }
      const product = await ProductModel.findById(productId);
      if (!product) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.NO_CONTENT_FOUND,
          "Product not found",
        );
      }
      //Upload new images to cloudinary
      const uploadImages = await uploadMultipleImages(customRequest.files);
      //Append keep old and add new one
      product.productImages.push(...uploadImages);
      //product.filePath.push(...customRequest.files.map((f) => f.filename));
      await product.save();
      return sendSuccess(
        res,
        CONSTANT_LIST.STATUS_SUCCESS,
        CONSTANT_LIST.STATUS_CODE_OK,
        "The product images has been added successfully",
        {},
      );
    } catch (err: any) {
      console.log(`Error in the adding the images for the product api ${err}`);
      return sendError(
        res,
        CONSTANT_LIST.STATUS_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR_MESSAGE,
      );
    }
  },
);

export const deleteAllProductImages = asyncHandler(
  async (
    req: express.Request<{ productId: string }>,
    res: express.Response,
  ) => {
    try {
      const product = await ProductModel.findById(req.params.productId);
      if (!product) {
        return sendError(res, 0, 404, "Product not found");
      }

      // 1️⃣ Delete images from Cloudinary
      for (const img of product.productImages) {
        if (img.publicId) {
          await cloudinary.uploader.destroy(img.publicId);
        }
      }

      // 2️⃣ Delete images from Multer (local storage)
      // for (const file of product.filePath) {
      //   const fullPath = path.join(process.cwd(), "public", "images", file);

      //   if (fs.existsSync(fullPath)) {
      //     fs.unlinkSync(fullPath);
      //   }
      // }

      // 3️⃣ Clear arrays
      product.productImages = [];
      //   product.filePath = [];

      await product.save();

      return sendSuccess(
        res,
        CONSTANT_LIST.STATUS_SUCCESS,
        CONSTANT_LIST.STATUS_CODE_OK,
        "Product image deleted successfully.",
        null,
      );
    } catch (err: any) {
      console.error("Error in list product api:", err);
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

// export const listAllProduct = asyncHandler(
//   async (
//     req: express.Request<{}, {}, {}, productSearchBody>,
//     res: express.Response,
//   ): Promise<express.Response> => {
//     try {
//       /* ---------------- PAGINATION ---------------- */
//       const page = Number(req.query.page) || 1;
//       const limit = Number(req.query.limit) || 10;
//       const skip = (page - 1) * limit;

//       /* ---------------- QUERY PARAMS ---------------- */
//       const { search, brand, category, sortBy, sortOrder, priceOrder } =
//         req.query;

//       /* ---------------- MATCH STAGE ---------------- */
//       const matchStage: any = {
//         isDeleted: false,
//       };

//       /* ---------- PRODUCT TEXT SEARCH ---------- */
//       if (search) {
//         matchStage.$text = { $search: search };
//       }

//       /* ---------- BRAND SEARCH ---------- */
//       if (brand) {
//         const brands = await BrandModel.find({
//           $text: { $search: brand },
//         }).select("_id");

//         matchStage.brandId = {
//           $in: brands.map((b) => b._id),
//         };
//       }

//       /* ---------- CATEGORY SEARCH ---------- */
//       if (category) {
//         const categories = await CategoryModel.find({
//           $text: { $search: category },
//         }).select("_id");

//         matchStage.categoryId = {
//           $in: categories.map((c) => c._id),
//         };
//       }

//       /* ---------------- SORT STAGE ---------------- */
//       const allowedSortFields: Record<string, string> = {
//         createdAt: "createdAt",
//         productName: "productName",
//         price: "price",
//         salePrice: "salePrice",
//       };

//       let sortStage: any = { createdAt: -1 }; // default

//       // Price specific sorting (highest priority)
//       if (priceOrder === "lowToHigh") {
//         sortStage = { salePrice: 1 };
//       } else if (priceOrder === "highToLow") {
//         sortStage = { salePrice: -1 };
//       }
//       // Generic sorting
//       else if (sortBy && allowedSortFields[sortBy]) {
//         sortStage = {
//           [allowedSortFields[sortBy]]: sortOrder === "asc" ? 1 : -1,
//         };
//       }

//       /* ---------------- AGGREGATION ---------------- */
//       const products = await ProductModel.aggregate([
//         { $match: matchStage },

//         {
//           $lookup: {
//             from: "brands",
//             localField: "brandId",
//             foreignField: "_id",
//             as: "brand",
//           },
//         },
//         { $unwind: "$brand" },

//         {
//           $lookup: {
//             from: "categories",
//             localField: "categoryId",
//             foreignField: "_id",
//             as: "category",
//           },
//         },
//         { $unwind: "$category" },

//         { $sort: sortStage },
//         { $skip: skip },
//         { $limit: limit },

//         {
//           $project: {
//             productName: 1,
//             productSlug: 1,
//             productDescription: 1,
//             price: 1,
//             salePrice: 1,
//             productImages: 1,
//             isFeatured: 1,
//             createdAt: 1,

//             brand: {
//               brandName: 1,
//               keywords: 1,
//             },

//             category: {
//               categoryName: 1,
//               keywords: 1,
//             },
//           },
//         },
//       ]);

//       /* ---------------- COUNT ---------------- */
//       const total = await ProductModel.countDocuments(matchStage);

//       if (!products.length) {
//         return sendError(
//           res,
//           CONSTANT_LIST.STATUS_ERROR,
//           CONSTANT_LIST.NO_DATA_FOUND,
//           "No products found",
//         );
//       }

//       /* ---------------- RESPONSE ---------------- */
//       return sendSuccess(
//         res,
//         CONSTANT_LIST.STATUS_SUCCESS,
//         CONSTANT_LIST.STATUS_CODE_OK,
//         "Product list fetched successfully",
//         {
//           products,
//           pagination: {
//             totalRecords: total,
//             currentPage: page,
//             totalPages: Math.ceil(total / limit),
//             pageSize: limit,
//           },
//         },
//       );
//     } catch (err: any) {
//       console.error("Error in the list product api:", err);
//       console.error("Error message:", err?.message);
//       console.error("Error stack:", err?.stack);
//       return sendError(
//         res,
//         CONSTANT_LIST.STATUS_ERROR,
//         CONSTANT_LIST.INTERNAL_SERVER_ERROR,
//         CONSTANT_LIST.INTERNAL_SERVER_ERROR_MESSAGE,
//       );
//     }
//   },
// );

export const listAllProduct = asyncHandler(
  async (
    req: express.Request<{}, {}, {}, productSearchBody>,
    res: express.Response,
  ): Promise<express.Response> => {
    try {
      /* ---------------- PAGINATION ---------------- */
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      const priceOrder = req.query.priceOrder;
      const sortBy = req.query.sortBy;
      const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
      const search = req.query?.search;

      /**------------ BASE MATCH----------------------- */
      const baseMatch: any = {
        isDeleted: false,
      };

      let sortStage: any = { createdAt: Date };

      if (priceOrder === "lowToHigh") {
        sortStage = { salePrice: 1 };
      } else if (priceOrder === "highToLow") {
        sortStage = { salePrice: -1 };
      } else if (sortBy && allowedSortFields[sortBy]) {
        sortStage = {
          [allowedSortFields[sortBy]]: sortOrder,
        };
      }
      const pipeLine: any[] = [
        {
          $match: baseMatch,
        },
        {
          $lookup: {
            from: "brands",
            localField: "brandId",
            foreignField: "_id",
            as: "brand",
          },
        },
        {
          $unwind: "$brand",
        },
        /* -------- CATEGORY LOOKUP -------- */
        {
          $lookup: {
            from: "categories",
            localField: "categoryId",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: "$category" },
      ];
      if (search) {
        pipeLine.push({
          $match: {
            $or: [
              {
                productName: { $regex: search, $options: "i" },
              },
              {
                productDescription: { $regex: search, $options: "i" },
              },
              {
                "brand.brandName": { $regex: search, $options: "i" },
              },
              {
                "brand.keywords": { $regex: search, $options: "i" },
              },
              {
                "category.categoryName": { $regex: search, $options: "i" },
              },
              {
                "category.keywords": { $regex: search, $options: "i" },
              },
            ],
          },
        });
      }
      /***-------------- PAGINATION AND PROJECTION---- */
      pipeLine.push(
        {
          $sort: sortStage,
        },
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
        {
          $project: {
            productName: 1,
            productSlug: 1,
            productDescription: 1,
            price: 1,
            salePrice: 1,
            productImages: 1,
            isFeatured: 1,
            createdAt: 1,

            brand: {
              brandName: 1,
              keywords: 1,
            },
            category: {
              categoryName: 1,
              keywords: 1,
            },
          },
        },
      );
      const products = await ProductModel.aggregate(pipeLine);
      /* ---------------- COUNT ---------------- */
      const countPipeline = [...pipeLine];
      countPipeline.splice(
        countPipeline.findIndex((s) => s.$skip),
        3,
      );
      countPipeline.push({ $count: "total" });

      const countResult = await ProductModel.aggregate(countPipeline);
      const total = countResult[0]?.total || 0;
      if (products.length === 0) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.NO_DATA_FOUND,
          "No product found",
        );
      }
      return sendSuccess(
        res,
        CONSTANT_LIST.STATUS_SUCCESS,
        CONSTANT_LIST.STATUS_CODE_OK,
        "Product list fetched successfully.",
        {
          products,
          pagination: {
            totalRecords: total,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            pageSize: limit,
          },
        },
      );
    } catch (err: any) {
      console.error("Error in the list product api:", err);
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
