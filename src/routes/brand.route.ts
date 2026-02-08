import express from "express";
import { brandValidation } from "../validations/brand.validation";
import { validateAPI } from "../middlewares/validation.middleware";
import {
  addBrand,
  deleteBrand,
  deleteBrandImage,
  listAllBrand,
  updateBrand,
  updateBrandImage,
} from "../controllers/brand.controller";
import { verifyUser } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";
import { brandNewValidation } from "../validations/brandNewValidation";
const brandRouter = express.Router();

brandRouter.post(
  "/",
  verifyUser,
  upload.single("brandImage"),
  brandValidation(),
  validateAPI,
  addBrand,
);

brandRouter.delete("/", verifyUser, deleteBrand);

brandRouter.put(
  "/",
  verifyUser,
  brandNewValidation(),
  validateAPI,
  updateBrand,
);
brandRouter.get("/", listAllBrand);

brandRouter.post(
  "/update-image",
  upload.single("brandImage"),
  verifyUser,
  updateBrandImage,
);

brandRouter.post(
  "/delete-image",
  upload.single("brandImage"),
  verifyUser,
  deleteBrandImage,
);

export default brandRouter;
