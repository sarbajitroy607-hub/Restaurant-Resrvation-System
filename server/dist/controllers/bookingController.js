import { Restaurant } from "../models/Restaurant.js";
import { Booking } from "../models/Booking.js";
// create a new booking
// POST/api/booking
// @access Private
export const createBooking = async (req, res) => {
    try {
        const { restaurantId, date, time, guests, occasion, specialRequest } = req.body;
        if (!restaurantId || !date || !time || !guests) {
            res.status(400).json({
                message: "Please provide all the required reservation details"
            });
            return;
        }
        // CHECK IF THE RESTAURANT EXISTS
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            res.status(400).json({
                message: "Restaurant is not found"
            });
            return;
        }
        // VERIFY RESTAURANT IS APPROVED
        if (restaurant.status !== "approved") {
            res.status(400).json({
                message: "Reservations are not opened for this restaurant"
            });
            return;
        }
        // VERIFY SEAT AVAILABILITY
        const requestedGuests = Number(guests);
        const existingBooking = await Booking.find({
            restaurant: restaurantId,
            date: new Date(date),
            time,
            status: "confirmed",
        });
        const bookedSeats = existingBooking.reduce((sum, b) => sum + b.guests, 0);
        const totalSeats = restaurant.totalSeats || 20;
        const availableSeats = totalSeats - bookedSeats;
        if (requestedGuests > availableSeats) {
            res.status(400).json({
                message: "Not enough seats available for this time slot"
            });
            return;
        }
        // CREATE NEW BOOKING
        const booking = await Booking.create({
            user: req.user?._id,
            restaurant: restaurantId,
            date: new Date(date),
            time,
            guests: requestedGuests,
            occasion,
            specialRequest,
            status: "confirmed",
        });
        // populate restaurant info before returning
        const populatedBooking = await booking.populate({
            path: "restaurant",
            select: "name location image address"
        });
        res.status(201).json({
            message: "Booking created successfully",
            booking: populatedBooking,
        });
    }
    catch (error) {
        console.error(error);
        res.status(400).json({
            message: error.message
        });
    }
};
// get a logged in user booking
// GET/api/booking/my
// @access Private
export const getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({
            user: req.user?._id
        }).populate("restaurant", "name location image address");
        res.status(200).json({
            message: "Bookings fetched successfully",
            bookings,
        });
    }
    catch (error) {
        console.error(error);
        res.status(400).json({
            message: error.message
        });
    }
};
// cancel a booking
// PUT/api/booking/:id/cancel
// @access Private
export const cancelBookings = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            res.status(404).json({ message: "Booking not found" });
            return;
        }
        // verify user owns the booking
        if (booking.user.toString() !== req.user?._id?.toString()) {
            res.status(403).json({ message: "Not authorized to cancel this booking" });
            return;
        }
        // cancel the booking
        booking.status = "cancelled";
        await booking.save();
        res.status(200).json({
            message: "Booking cancelled successfully",
            booking,
        });
    }
    catch (error) {
        console.error(error);
        res.status(400).json({
            message: error.message
        });
    }
};
