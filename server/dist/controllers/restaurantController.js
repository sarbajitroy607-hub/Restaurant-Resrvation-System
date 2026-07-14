import { Restaurant } from "../models/Restaurant.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.js";
import { Booking } from "../models/Booking.js";
// Get all restaurants with search and filters
// GET /api/restaurants
export const getRestaurants = async (req, res) => {
    try {
        const { search, rating, location, cuisine, priceRange, sort } = req.query;
        const filter = {};
        // Search restaurant by name
        if (search) {
            filter.name = {
                $regex: search,
                $options: "i"
            };
        }
        // Price range filter - filter by priceRange symbols directly
        if (priceRange) {
            const ranges = Array.isArray(priceRange) ? priceRange : [priceRange];
            filter.priceRange = { $in: ranges };
        }
        // Rating filter
        if (rating) {
            filter.rating = {
                $gte: Number(rating)
            };
        }
        // Location filter
        if (location) {
            filter.location = {
                $regex: location,
                $options: "i"
            };
        }
        // Cuisine filter
        if (cuisine) {
            const cuisines = (Array.isArray(cuisine) ? cuisine : [cuisine])
                .filter((value) => typeof value === "string");
            if (cuisines.length === 0) {
                res.status(400).json({ message: "Cuisine must be a string" });
                return;
            }
            filter.cuisine = {
                $in: cuisines.map(c => new RegExp(c, "i"))
            };
        }
        // Sorting
        let sortObj = { createdAt: -1 }; // default sort
        if (sort) {
            const sortStr = String(sort).toLowerCase().trim();
            if (sortStr === "price_low") {
                sortObj = { priceRange: 1 }; // $ comes before $$$$
            }
            else if (sortStr === "price_high") {
                sortObj = { priceRange: -1 }; // $$$$ comes before $
            }
        }
        const restaurants = await Restaurant
            .find(filter)
            .sort(sortObj);
        res.status(200).json({
            success: true,
            count: restaurants.length,
            restaurants
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// Get featured and exclusive restaurants
// GET /api/restaurants/featured
export const getFeaturedRestaurants = async (req, res) => {
    try {
        const restaurants = await Restaurant.find({
            $or: [
                { featured: true },
                { exclusive: true }
            ]
        });
        res.status(200).json({
            success: true,
            count: restaurants.length,
            restaurants
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// Get single restaurant by slug
// GET /api/restaurants/:slug
export const getRestaurantBySlug = async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ slug: req.params.slug });
        if (!restaurant) {
            res.status(404).json({ message: "Restaurant not found" });
            return;
        }
        // If not approved, verify authorization (owner or admin)
        if (restaurant.status !== "approved") {
            let isAuthorized = false;
            if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
                try {
                    const token = req.headers.authorization.split(" ")[1];
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    const user = await User.findById(decoded.id);
                    if (user &&
                        (user.role === "admin" ||
                            (user.role === "owner" &&
                                restaurant.owner.toString() === user._id.toString()))) {
                        isAuthorized = true;
                    }
                }
                catch (err) {
                    // Ignore token verify error
                }
            }
            if (!isAuthorized) {
                res.status(404).json({
                    message: "Restaurant not found or pending approval"
                });
                return;
            }
        }
        res.json(restaurant);
    }
    catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message });
    }
};
// Get dynamic seat availability for slots
// GET /api/restaurants/:id/availability
export const getRestaurantAvailability = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) {
            res.status(400).json({ message: "Please provide a date" });
            return;
        }
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) {
            res.status(404).json({ message: "Restaurant not found" });
            return;
        }
        const bookingDate = new Date(date);
        // Get all active booking on this date for the resturant
        const booking = await Booking.find({
            restaurant: restaurant._id,
            date: bookingDate,
            status: "confirmed",
        });
        // map slots to avilable capcities
        // map slots to available capacities
        const availability = restaurant.availableSlots.map((slot) => {
            const bookedSeats = booking
                .filter((b) => b.time === slot)
                .reduce((sum, b) => sum + b.guests, 0);
            const totalSeats = restaurant.totalSeats || 20;
            const availableSeats = Math.max(0, totalSeats - bookedSeats);
            return {
                time: slot,
                availableSeats,
                isAvailable: availableSeats > 0
            };
        });
        res.json(availability);
    }
    catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message });
    }
};
