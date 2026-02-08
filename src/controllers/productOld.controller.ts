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

export const addProduct = asyncHandler(
  async (req: express.Request, res: express.Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();
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

      // const productImages: string[] | null =
      //   customRequest.files && Array.isArray(customRequest.files)
      //     ? customRequest.files.map((file) => file.filename)
      //     : null;

      if (!customRequest.files || customRequest.files.length === 0) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.VALIDATION_ERROR,
          "Please upload at least one product image.",
        );
      }
      if (salePrice && salePrice >= price) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "Sale price must be less than product price",
        );
      }
      const categoryExists = await CategoryModel.findOne(
        { _id: categoryId },
        null,
        { session },
      );

      if (!categoryExists) {
        await session.abortTransaction();
        session.endSession();
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          "Invalid category selected",
        );
      }
      const brandExists = await BrandModel.findOne({ _id: brandId }, null, {
        session,
      });
      if (!brandExists) {
        await session.abortTransaction();
        session.endSession();
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
      const [product] = await ProductModel.create(
        [
          {
            productName,
            productDescription,
            productSlug,
            price,
            salePrice,
            categoryId,
            brandId,
            productImages: productImagesList,
            isFeatured,
          },
        ],
        {
          session,
        },
      );

      //commit transaction
      await session.commitTransaction();
      session.endSession();
      return sendSuccess(
        res,
        CONSTANT_LIST.STATUS_SUCCESS,
        CONSTANT_LIST.STATUS_CODE_OK,
        "The product added successfully",
        product,
      );
    } catch (err: any) {
      await session.abortTransaction();
      session.endSession();

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
