import mongoose, { Types, Document, Schema, mongo } from "mongoose";

export interface itemFields {
  productId: Types.ObjectId;
  productName: string;
  quantity: number;
  price: number;
  totalPrice: number;
}
export interface itemDocument extends itemFields, Document {}

export interface cartDocument extends Document {
  cartId: string;
  items: itemFields[];
  couponCode?: string;
  discount?: number;
  payableAmount: number;
  bill: number;
}
const itemSchema = new Schema<itemDocument>(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: {
      type: String,
    },
    quantity: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    totalPrice: {
      type: Number,
    },
  },
  {
    timestamps: true,
  },
);
const cartSchema = new Schema<cartDocument>({
  cartId: String,
  items: [itemSchema],
  bill: Number,
  couponCode: Number,
  discount: Number,
  payableAmount: Number,
});

export const CartModel = mongoose.model("Cart", cartSchema);
export const ItemModel = mongoose.model("Item", itemSchema);
