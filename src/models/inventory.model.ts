import mongoose, { Schema, Document, Types } from "mongoose";

export enum INVENTORY_STATUS {
  IN_STOCK = "IN_STOCK",
  LOW_STOCK = "LOW_STOCK",
  OUT_OF_STOCK = "OUT_OF_STOCK",
}

export interface InventoryDocument extends Document {
  productId: Types.ObjectId;
  sku: string;
  quantity: number;
  reservedQuantity: number;
  reorderLevel: number;
  reorderQuantity: number;
  warehouseLocation: string;
  status: INVENTORY_STATUS;
  lastRestockedAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const inventorySchema = new Schema<InventoryDocument>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    reservedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    reorderLevel: {
      type: Number,
      default: 10,
      min: 0,
    },

    reorderQuantity: {
      type: Number,
      default: 50,
      min: 1,
    },

    warehouseLocation: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: Object.values(INVENTORY_STATUS),
      default: INVENTORY_STATUS.IN_STOCK,
    },

    lastRestockedAt: {
      type: Date,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

inventorySchema.pre("save", function (next) {
  const inventory = this as InventoryDocument;
  const availableStock = inventory?.quantity - inventory?.reservedQuantity;
  if (availableStock <= 0) {
    inventory.status = INVENTORY_STATUS.OUT_OF_STOCK;
  } else if (availableStock <= inventory.reorderLevel) {
    inventory.status = INVENTORY_STATUS.LOW_STOCK;
  } else {
    inventory.status = INVENTORY_STATUS.IN_STOCK;
  }
  next();
});

// One inventory per product
inventorySchema.index({ productId: 1 }, { unique: true });

// Fast stock queries
inventorySchema.index({ status: 1 });

// Warehouse based filtering
inventorySchema.index({ warehouseLocation: 1 });

export const InventoryModel =
  mongoose.models.Inventory ||
  mongoose.model<InventoryDocument>("Inventory", inventorySchema);
