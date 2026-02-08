import express from "express";
import { verifyUser } from "../middlewares/auth.middleware";
import { addRating, deleteRating } from "../controllers/rating.controller";

const ratingRouter = express.Router();

ratingRouter.post("/add-rating", verifyUser, addRating);
ratingRouter.post("/delete-rating", verifyUser, deleteRating);

export default ratingRouter;
