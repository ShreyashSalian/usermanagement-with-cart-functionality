// import mongoose, { Types, Document, Schema } from "mongoose";

// interface OrderItem {
//   productId: Types.ObjectId;
//   productName: string;
//   quantity: number;
//   price: number;
// }

// enum PAYMENT_STATUS {
//   PENDING = "pending",
//   COMPLETED = "completed",
//   FAILED = "failed",
// }

// enum ORDER_STATUS {
//   PENDING = "pending",
//   CONFIRMED = "confirmed",
//   SHIPPED = "shipped",
//   DELIVERED = "delivered",
//   CANCELLED = "cancelled",
// }

// interface OrderDocument extends Document {
//   orderId: string;
//   userId: Types.ObjectId;
//   items: OrderItem[];
//   totalAmount: number;
//   paymentStatus: string;
//   orderStatus: string;
//   couponCode?: string;
//   discount?: number;
//   payableAmount: number;
//   createdAt: Date;
//   updatedAt: Date;
// }

// const orderItemSchema = new Schema<OrderItem>({
//   productId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Product",
//     required: true,
//   },
//   productName: {
//     type: String,
//     required: true,
//   },
//   quantity: {
//     type: Number,
//     required: true,
//   },
//   price: {
//     type: Number,
//     required: true,
//   },
// });

// const orderSchema = new Schema<OrderDocument>(
//   {
//     orderId: {
//       type: String,
//       required: true,
//       unique: true,
//     },
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     items: [orderItemSchema],
//     totalAmount: {
//       type: Number,
//       required: true,
//     },
//     paymentStatus: {
//       type: String,
//       enum: Object.values(PAYMENT_STATUS),
//       default: PAYMENT_STATUS.PENDING,
//     },
//     orderStatus: {
//       type: String,
//       enum: Object.values(ORDER_STATUS),
//       default: ORDER_STATUS.PENDING,
//     },
//     couponCode: Number,
//     discount: Number,
//     payableAmount: Number,
//   },
//   {
//     timestamps: true,
//   },
// );

// orderSchema.index({ userId: 1, createdAt: -1 });

// export const OrderModel = mongoose.model<OrderDocument>("Order", orderSchema);

//---New code----------------------
import mongoose, { Types, Document, Schema } from "mongoose";

//-------Order Item---------------------
export interface orderItem {
  productId: Types.ObjectId;
  productName: string;
  quantity: number;
  price: number;
}

//------------Order status------------------------------------------------
export enum ORDER_STATUS {
  PENDING = "PENDING",
  PLACED = "PLACED",
  CONFIRMED = "CONFIRMED",
  PACKED = "PACKED",
  SHIPPED = "SHIPPED",
  OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
  RETURN_REQUESTED = "RETURN_REQUESTED",
  RETURNED = "RETURNED",
}

/* -------------------- PAYMENT STATUS -------------------- */
export enum PAYMENT_STATUS {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

//-----------------------STATUS HISTORY-----------------------------------------
export interface OrderStatusHistory {
  status: ORDER_STATUS;
  changedAt: Date;
  changedBy?: Types.ObjectId;
}

//---------------------- ORDER DOCUMENT-----------------------------------------
export interface OrderDocument extends Document {
  orderId: string;
  userId: Types.ObjectId;
  items: orderItem[];
  paymentStatus: PAYMENT_STATUS;
  totalAmount: number;
  discount?: number;
  payableAmount: number;
  couponCode?: string;
  orderStatus: ORDER_STATUS;
  statusHistory: OrderStatusHistory[];
  createdAt: Date;
  updatedAt: Date;
}

//------------------------ORDER ITEM SCHEMA---------------------------------------
const orderItemSchema = new Schema<orderItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
    },
  },
  { _id: false },
);

//------------------------- STATUS HISTORY SCHEMA----------------------------------------
const orderStatusHistorySchema = new Schema<OrderStatusHistory>(
  {
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now(),
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    _id: false,
  },
);

//----------------------------- ORDER SCHEMA-------------------------------------
const orderSchema = new Schema<OrderDocument>(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    payableAmount: {
      type: Number,
      required: true,
    },
    couponCode: {
      type: String,
      uppercase: true,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },
    orderStatus: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PLACED,
    },
    statusHistory: {
      type: [orderStatusHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

//------------------------ INDEXES--------------------------------------
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });

//-------------------MODEL-----------------------------------------------
export const OrderModel = mongoose.model<OrderDocument>("Order", orderSchema);
