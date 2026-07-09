import { Request, Response } from "express";
import { Restaurant } from  "../models/Restaurant.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.js";
import { Booking } from "../models/Booking.js";
import {time} from "node:console"


// Get all restaurants with search and filters
// GET /api/restaurants

export const getResturants = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const {
            search,
            minPrice,
            maxPrice,
            rating,
            location,
            sortBy,
            order
        } = req.query;

        const filter: any = {};

        // Search restaurant by name
        if (search) {
            filter.name = {
                $regex: search,
                $options: "i"
            };
        }

        // Price range filter
        if (minPrice || maxPrice) {
            filter.price = {};

            if (minPrice) {
                filter.price.$gte = Number(minPrice);
            }

            if (maxPrice) {
                filter.price.$lte = Number(maxPrice);
            }
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


        // Sorting
        let sort: any = {};

        if (sortBy) {
            sort[sortBy as string] = order === "desc" ? -1 : 1;
        } else {
            sort.createdAt = -1; // latest first
        }


        const restaurants = await Restaurant
            .find(filter)
            .sort(sort);


        res.status(200).json({
            success: true,
            count: restaurants.length,
            restaurants
        });


    } catch (error: any) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// Get featured and exclusive restaurants
// GET /api/restaurants/featured

export const getFeaturedtResturants = async (
    req: Request,
    res: Response
): Promise<void> => {
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

    } catch (error: any) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



// Get single restaurant by slug
// GET /api/restaurants/:slug

export const getRestaurantBySlug = async (req: Request, res: Response): Promise<void> => {
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

                    const decoded = jwt.verify(
                        token,
                        process.env.JWT_SECRET as string
                    ) as { id: string };


                    const user = await User.findById(decoded.id);


                    if (
                        user &&
                        (
                            user.role === "admin" ||
                            (
                                user.role === "owner" &&
                                restaurant.owner.toString() === user._id.toString()
                            )
                        )
                    ) {
                        isAuthorized = true;
                    }

                } catch (err) {
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

    } catch (error: any) {
        console.error(error);
        res.status(400).json({ message: error.message });
    }
};


// Get dynamic seat availability for slots
// GET /api/restaurants/:id/availability

export const getRestaurantAvailability = async (
    req: Request,
    res: Response
): Promise<void> => {
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

        const bookingDate = new Date(date as string);
        // Get all active booking on this date for the resturant

        const booking = await Booking.find({
            restaurant:restaurant._id,
            date:bookingDate,
            status:"confirmed",

        })

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
        res.json(availability)


    } catch (error: any) {
        console.error(error);
        res.status(400).json({ message: error.message });
    }
};