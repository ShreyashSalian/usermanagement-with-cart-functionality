// import mongoose, { Types, Document, Schema } from "mongoose";

// interface productDocument extends Document {
//   productName: string;
//   productDescription: string;
//   productQuantity: number;
//   productPrice: number;
//   productCategory: Types.ObjectId;
//   productBrand: Types.ObjectId;
//   productImages: {
//     url: string;
//     publicId: string;
//   }[];
//   filePath: string[];
//   averageRating: number;
//   totalRating: number;
//   isDeleted: boolean;
//   createdAt: Date;
//   updatedAt: Date;
// }

// const productSchema = new Schema<productDocument>(
//   {
//     productName: {
//       type: String,
//       required: true,
//     },
//     productDescription: {
//       type: String,
//       required: true,
//     },
//     productCategory: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Category",
//       required: true,
//     },
//     productBrand: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Brand",
//       required: true,
//     },
//     productQuantity: {
//       type: Number,
//       required: true,
//     },
//     productPrice: {
//       type: Number,
//       required: true,
//     },
//     productImages: [
//       {
//         url: {
//           type: String,
//           required: true,
//         },
//         publicId: {
//           type: String,
//           required: true,
//         },
//       },
//     ],
//     filePath: [
//       {
//         type: String,
//       },
//     ],

//     averageRating: {
//       type: Number,
//       default: 0,
//     },
//     totalRating: {
//       type: Number,
//       default: 0,
//     },

//     isDeleted: {
//       type: Boolean,
//     },
//   },
//   {
//     timestamps: true,
//   },
// );

// export const ProductModel = mongoose.model<productDocument>(
//   "Product",
//   productSchema,
// );

import mongoose, { Schema, Document, Types } from "mongoose";

export interface ProductDocument extends Document {
  productName: string;
  productSlug: string;
  productDescription: string;

  categoryId: Types.ObjectId;
  brandId: Types.ObjectId;

  price: number;
  salePrice?: number;

  productImages: {
    url: string;
    publicId: string;
  }[];
  averageRating: number;
  totalRating: number;

  isFeatured: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<ProductDocument>(
  {
    productName: {
      type: String,
      required: true,
      trim: true,
    },

    productSlug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    productDescription: {
      type: String,
      required: true,
    },

    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    brandId: {
      type: Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    salePrice: {
      type: Number,
      min: 0,
    },

    productImages: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],

    isFeatured: {
      type: Boolean,
      default: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    totalRating: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

/* 🔍 Indexes */
productSchema.index({ productName: "text", productDescription: "text" });
productSchema.index({ categoryId: 1 });
productSchema.index({ brandId: 1 });

export const ProductModel = mongoose.model<ProductDocument>(
  "Product",
  productSchema,
);
