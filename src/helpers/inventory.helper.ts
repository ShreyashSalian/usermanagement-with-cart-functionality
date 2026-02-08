import mongoose, { Types } from "mongoose";
import { INVENTORY_STATUS } from "../models/inventory.model";
export interface inventoryHelper {
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
}

export interface inventorySearchBody {
  page: number;
  limit: number;
  status: string;
  warehouseLocation?: string;
  isActive: boolean;
  sortOrder?: string;
  sortBy?: string;
}
