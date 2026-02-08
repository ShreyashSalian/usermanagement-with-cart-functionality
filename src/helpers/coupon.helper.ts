export interface couponHelper {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minCartValue: number;
  maxDiscount: number;
  startDate: Date;
  endDate: Date;
  usageLimit: number;
  isActive: boolean;
}
