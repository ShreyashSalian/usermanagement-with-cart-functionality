export interface CategoryListQuery {
  page?: string;
  limit?: string;
  search?: string;
  isFeatured?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// export interface productSearchBody {
//   page?: string;
//   limit?: string;
//   search?: string;
//   brand?: string;
//   category?: string;
//   sortBy?: string;
//   sortOrder?: "asc" | "desc";
//   priceOrder?: "lowToHigh" | "highToLow";
// }

export interface productSearchBody {
  page?: string;
  limit?: string;
  search?: string;

  sortBy?: string;
  orderStatus?: string;
  startDate?: Date;
  endDate?: Date;
  sortOrder?: "asc" | "desc";
  priceOrder?: "lowToHigh" | "highToLow";
}

export const allowedSortFields: Record<string, string> = {
  createdAt: "createdAt",
  price: "price",
  salePrice: "salePrice",
  productName: "productName",
};
