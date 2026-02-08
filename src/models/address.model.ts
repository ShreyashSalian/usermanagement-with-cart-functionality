import mongoose, { Types, Document, Schema } from "mongoose";

interface addressDocument extends Document {
  userId: Types.ObjectId;
  street: string;
  city: string;
  state: string;
  country: string;
  zipcode: string;
  isDefault: boolean;
}

const addressSchema = new Schema<addressDocument>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    street: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    zipcode: {
      type: String,
      required: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export const AddressModel = mongoose.model<addressDocument>(
  "Address",
  addressSchema,
);
