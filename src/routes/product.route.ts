import express from "express";
import { verifyUser } from "../middlewares/auth.middleware";
import { productValidator } from "../validations/product.validation";
import { validateAPI } from "../middlewares/validation.middleware";
import {
  addNewProductImages,
  addProduct,
  deleteAllProductImages,
  deleteProduct,
  deleteProductImages,
  listAllProduct,
  updateProduct,
} from "../controllers/product.controller";
import { upload } from "../middlewares/multer.middleware";
import { productNewValidator } from "../validations/productNew.Validation";

const productRouter = express.Router();

productRouter.post(
  "/",
  verifyUser,
  upload.array("productImages", 5),
  productValidator(),
  validateAPI,
  addProduct,
);

productRouter.put(
  "/",
  verifyUser,
  productNewValidator(),
  validateAPI,
  updateProduct,
);
productRouter.delete("/", verifyUser, deleteProduct);

productRouter.post("/delete-image", verifyUser, deleteProductImages);
productRouter.post(
  "/add-image",
  verifyUser,
  upload.array("productImages", 5),
  addNewProductImages,
);
productRouter.post("/delete-all-images", verifyUser, deleteAllProductImages);

productRouter.post("/search-product", listAllProduct);
export default productRouter;
