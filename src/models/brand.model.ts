import mongoose, { Types, Document, Schema } from "mongoose";

interface brandDocument extends Document {
  brandName: string;
  brandDescription: string;
  brandImage: {
    url: string | null;
    publicId: string | null;
  };
  keywords: string;
  filePath: string;
  isFeatured: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const brandSchema = new Schema<brandDocument>(
  {
    brandName: {
      type: String,
      required: true,
    },
    brandDescription: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      default: null,
    },
    brandImage: {
      url: {
        type: String,
        // required: true,
        default: null,
      },
      publicId: {
        type: String,
        default: null,
        // required: true,
      },
    },

    // status: {
    //   type: String,
    //   enum: Object.values(CategoryStatus),
    //   default: CategoryStatus.ACTIVE,
    // },
    keywords: [
      {
        type: String,
        required: true,
      },
    ],
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);
brandSchema.index({ brandName: "text", keywords: "text" });
export const BrandModel = mongoose.model<brandDocument>("Brand", brandSchema);
