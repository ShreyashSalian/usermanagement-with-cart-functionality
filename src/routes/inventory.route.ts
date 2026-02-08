import express from "express";
import { verifyUser } from "../middlewares/auth.middleware";
import { inventoryValidation } from "../validations/inventory.validation";
import { validateAPI } from "../middlewares/validation.middleware";
import {
  addInventory,
  deleteInventory,
  getInventory,
  listAllInventory,
  updateInventory,
} from "../controllers/inventory.controller";

export const inventoryRouter = express.Router();
inventoryRouter.post(
  "/",
  verifyUser,
  inventoryValidation(),
  validateAPI,
  addInventory,
);
inventoryRouter.get("/", verifyUser, getInventory);
inventoryRouter.put(
  "/",
  verifyUser,
  inventoryValidation(),
  validateAPI,
  updateInventory,
);
inventoryRouter.delete("/", verifyUser, deleteInventory);
inventoryRouter.get("/list-inventory", verifyUser, listAllInventory);

export default inventoryRouter;
