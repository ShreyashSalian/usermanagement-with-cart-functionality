import mongoose, { Schema, Document } from "mongoose";

export interface CouponDocument extends Document {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minCartValue: number;
  maxDiscount: number;
  startDate: Date;
  endDate: Date;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  usedByUsers: string[];
}

const CouponSchema = new Schema<CouponDocument>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
    },
    minCartValue: {
      type: Number,
      default: 0,
    },
    maxDiscount: {
      type: Number,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    usageLimit: {
      type: Number,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    usedByUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true },
);

CouponSchema.index({ code: 1 });

// CouponSchema.pre("save",async function(next){
//     if(this.endDate < new Date()){
//         this.isActive = false;
//     }
//     next
// })
export const CouponModel = mongoose.model<CouponDocument>(
  "Coupon",
  CouponSchema,
);
