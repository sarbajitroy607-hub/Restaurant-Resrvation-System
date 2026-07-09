import { Router } from "express";
import { getFeaturedtResturants, getRestaurantAvailability, getRestaurantBySlug, getResturants } from "../controllers/restaurantController.js";


const restaurantRouter = Router();

restaurantRouter.get('/',getResturants);
restaurantRouter.get('/featured', getFeaturedtResturants );
restaurantRouter.get('/:slug', getRestaurantBySlug );
restaurantRouter.get('/:id/availability', getRestaurantAvailability );

export default restaurantRouter;

