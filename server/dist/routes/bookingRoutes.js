import { Router } from 'express';
import { cancelBookings, createBooking, getMyBookings } from '../controllers/bookingController.js';
import { protect } from '../middlewares/auth.js';
const bookingRouter = Router();
// Create a new booking
bookingRouter.post("/", protect, createBooking);
bookingRouter.get("/my", protect, getMyBookings);
bookingRouter.put("/:id/cancel", protect, cancelBookings);
export default bookingRouter;
