import { Router } from "express";
import { getFeaturedRestaurants, getRestaurantAvailability, getRestaurantBySlug, getRestaurants } from "../controllers/restaurantController.js";
const restaurantRouter = Router();
restaurantRouter.get('/', getRestaurants);
restaurantRouter.get('/featured', getFeaturedRestaurants);
restaurantRouter.get('/:id/availability', getRestaurantAvailability);
restaurantRouter.get('/:slug', getRestaurantBySlug);
export default restaurantRouter;
