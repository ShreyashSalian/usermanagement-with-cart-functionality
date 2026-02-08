import mongoose, { Types, Document, Schema } from "mongoose";

interface categoryDocument extends Document {
  categoryName: string;
  categoryDescription: string;
  categoryImage: {
    url: string | null;
    publicId: string | null;
  };
  categorySlug: string;
  keywords: string;
  filePath: string;
  isFeatured: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<categoryDocument>(
  {
    categoryName: {
      type: String,
      required: true,
    },
    categoryDescription: {
      type: String,
      required: true,
    },
    categorySlug: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      default: null,
    },
    categoryImage: {
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
categorySchema.index({ categoryName: "text", keywords: "text" });

export const CategoryModel = mongoose.model<categoryDocument>(
  "Category",
  categorySchema,
);
