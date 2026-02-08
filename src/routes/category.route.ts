import express from "express";
import { categoryValidation } from "../validations/category.validation";
import { validateAPI } from "../middlewares/validation.middleware";
import {
  addCategory,
  deleteCategory,
  deleteCategoryImage,
  listAllCategory,
  updateCategory,
  updateCategoryImage,
} from "../controllers/category.controller";
import { verifyUser } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";
import { categoryNewValidation } from "../validations/categoryNew.validation";

const categoryRouter = express.Router();

categoryRouter.post(
  "/",
  verifyUser,
  upload.single("categoryImage"),
  categoryValidation(),
  validateAPI,
  addCategory,
);

categoryRouter.put(
  "/",
  verifyUser,
  categoryNewValidation(),
  validateAPI,
  updateCategory,
);

categoryRouter.get("/", listAllCategory);
categoryRouter.delete("/", verifyUser, deleteCategory);

categoryRouter.post(
  "/update-image",
  upload.single("categoryImage"),
  verifyUser,
  updateCategoryImage,
);

categoryRouter.post(
  "/delete-image",
  upload.single("categoryImage"),
  verifyUser,
  deleteCategoryImage,
);

export default categoryRouter;
