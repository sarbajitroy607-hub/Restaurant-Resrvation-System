import { Router } from "express";
import {  createOwnerRestaurant, getOwnerBookings, getOwnwerRestaurants, updateBookingStatus, updateOwnerRestaurant } from "../controllers/ownerController.js";
import upload from "../config/multer.js";
import { ownerOnly, protect } from "../middlewares/auth.js";

const ownerRouter = Router();


ownerRouter.use(protect);  // Apply the protect middleware to all routes in this router
ownerRouter.use(ownerOnly);  // Apply the ownerOnly middleware to all routes in this router



ownerRouter.get("/restaurants", getOwnwerRestaurants);
ownerRouter.post("/restaurants", upload.single("image"), createOwnerRestaurant  );
ownerRouter.put("/restaurants/:id", upload.single("image"), updateOwnerRestaurant);
ownerRouter.get("/booking", getOwnerBookings );
ownerRouter.put("/booking", updateBookingStatus);

export default ownerRouter;
 





