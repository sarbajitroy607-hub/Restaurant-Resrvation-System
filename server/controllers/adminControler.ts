import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.js";
import { Restaurant } from "../models/Restaurant.js";
import { Booking } from "../models/Booking.js";
import { User } from "../models/user.js";


// get all restaurant for admin management
// get /api/admin/restaurants

export const getAllRestaurants = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const restaurant = await Restaurant.find({}).populate("owner", "name email phone").sort({createdAt: -1});
        res.status(200).json({
            success: true,
            data: restaurant
        });

    } catch (error: any) {
        res.status(400).json({
            message: error.message || "Internal Server Error"
        });
    }
}

// Approve /reject a restaurant profile
// PUT /api/admin/restaurants/:id/approve

export const approveRestaurant = async (req: AuthRequest, res: Response): Promise<void> => {
    try {

        const { status } = req.body;
        if (!status || !["approved", "rejected", "pending"].includes(status)) {
            res.status(400).json({
                message: "Please provide a valid  approval status."
            });
            return;
        }
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) {
            res.status(404).json({
                message: "Restaurant not found."
            });
            return;
        }
        restaurant.status = status;
        await restaurant.save();

        res.status(200).json({
            success: true,
            message: "Restaurant status updated successfully."
        });

    } catch (error: any) {
        res.status(400).json({
            message: error.message || "Internal Server Error"
        });
    }
}

// Get  System statistics
// GET /api/admin/statistics

export const getAdminStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const totalUsers = await User.countDocuments({ role: "user" });
        const totalOwners = await User.countDocuments({ role: "owner" });
        const totalBookings = await Booking.countDocuments();
        const totalRestaurants = await Restaurant.countDocuments();

        // Get latest 10 bookings
        const latestBookings = await Booking.find({}).sort({ createdAt: -1 }).limit(10).populate("user", "name email").populate("restaurant", "name");

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalOwners,
                totalBookings,
                totalRestaurants,
                latestBookings
            }
        });

    } catch (error: any) {
        res.status(400).json({
            message: error.message || "Internal Server Error"
        });
    }
}
