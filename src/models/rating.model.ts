import mongoose, { Types, Document, Schema } from "mongoose";

interface RatingDocument extends Document {
  userId: Types.ObjectId;
  productId: Types.ObjectId;
  rating: number;
  createdAt: Date;
  updated: Date;
}

const ratingSchema = new Schema<RatingDocument>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
  },
  {
    timestamps: true,
  },
);

export const ProductRatingModel = mongoose.model<RatingDocument>(
  "ProductRating",
  ratingSchema,
);
