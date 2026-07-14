
import fs from "fs";
import path from "path";
import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.js";
import { Booking } from "../models/Booking.js";
import { Restaurant } from "../models/Restaurant.js";
import { v2 as cloudinary } from "cloudinary";
import upload from "../config/multer.js";

const isCloudinaryConfigured = Boolean(
    process.env.CLOUDINARY_URL ||
    (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
);

if (isCloudinaryConfigured) {
    if (process.env.CLOUDINARY_URL) {
        cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL, secure: true });
    } else {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
            secure: true,
        });
    }
}




// helper function to upload buffer to cloudinary
const uploadToClodinary = (fileBuffer: Buffer): Promise<{ secure_url: string }> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "" },
            (error, result) => {
                if (error) return reject(error);
                if (!result) return reject(new Error("upload failed"));
                resolve({ secure_url: result.secure_url });
            }
        );

        uploadStream.end(fileBuffer);
    });
};

const parseCommaSeparatedValues = (value: unknown): string[] | undefined => {
    if (Array.isArray(value)) {
        return value.map(String).map((item) => item.trim()).filter(Boolean);
    }

    if (typeof value === "string") {
        return value.split(",").map((item) => item.trim()).filter(Boolean);
    }

    return undefined;
};

// Get owner ownwer restaurants
// Get /api/owner/restaurants
export const getOwnwerRestaurants = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
          const restaurant = await Restaurant.findOne({owner: req.user?._id})

        if(!restaurant){
            res.status(200).json(null);
            return
        }

        res.json(restaurant);

    } catch (error) {
        console.error("Error fetching owner restaurants:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// create owner restaurant(submitted to pending)
// Post /api/owner/restaurants
export const createOwnerRestaurant = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        console.log('createOwnerRestaurant: request received', {
            headers: req.headers,
            body: req.body,
            file: req.file ? { originalname: req.file.originalname, mimetype: req.file.mimetype, size: req.file.size } : null,
        });

        const existingRestaurant = await Restaurant.findOne({ owner: req.user?._id });
        if (existingRestaurant) {
            res.status(400).json({ message: "You already have a restaurant." });
            return;
        }
        const { name, description, priceRange, chef, tags, availableSlots, totalSeats, image, address, location, cuisine, openingHours } = req.body;
        try {
            fs.appendFileSync(path.join(process.cwd(), "owner-create-debug.log"), `\n---\n${new Date().toISOString()}\nheaders:\n${JSON.stringify(req.headers, null, 2)}\nbody keys:${Object.keys(req.body).join(",")}\nbody:\n${JSON.stringify(req.body, null, 2)}\nfile:${req.file ? JSON.stringify({ originalname: req.file.originalname, mimetype: req.file.mimetype, size: req.file.size }, null, 2) : null}\n`);
        } catch (err) {
            console.error("Failed to write debug log", err);
        }

        // lenient validation: require only essential fields for owner submission
        if (!name || !description || !priceRange || !chef || !address || !location || !cuisine) {
            console.error("createOwnerRestaurant: validation failed", { body: req.body, file: req.file ? true : false, contentType: req.headers["content-type"] });
            res.status(400).json({
                message: "Please provide required restaurant details: name, description, priceRange, chef, address, location, and cuisine.",
                receivedBody: req.body,
                bodyKeys: Object.keys(req.body),
                contentType: req.headers["content-type"],
            });
            return;
        }

        // generate slug from name
        const slug = name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");

        const slugExists = await Restaurant.findOne({ slug });
        if (slugExists) {
            res.status(400).json({ message: "A restaurant with this name already exists." });
            return;
        }

        // handle image
        let imageUrl = image; // default to the provided image URL
        if (req.file) {
            if (!isCloudinaryConfigured) {
                console.error("Cloudinary not configured. Please set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET.");
                res.status(500).json({ message: "Cloudinary is not configured on the server." });
                return;
            }
            try {
                const result = await uploadToClodinary(req.file.buffer);
                imageUrl = result.secure_url;
            } catch (uploadError: any) {
                console.error("Cloudinary upload failed", uploadError);
                res.status(502).json({
                    message: "Failed to upload restaurant image.",
                    error: uploadError?.message || uploadError,
                });
                return;
            }
        }

        // setup parsed tag and slots
        const parsedTags = typeof tags === "string" ? tags.split(",").map((tag: string) => tag.trim()) : tags;
        const parsedAvailableSlots = typeof availableSlots === "string" ? availableSlots.split(",").map((s: string) => s.trim()) : availableSlots;
        const parsedOpeningHours = typeof openingHours === "string" ? JSON.parse(openingHours) : openingHours;

        const restaurant = await Restaurant.create({
            name,
            slug,
            description,
            priceRange,
            chef,
            tags: parsedTags,
            availableSlots: parsedAvailableSlots,
            totalSeats:totalSeats ? Number(totalSeats) : 20,
            image: imageUrl,
            address,
            location,
            cuisine,
            owner: req.user?._id,
            status: "pending", // set status to pending
        });
        console.log("createOwnerRestaurant: created", { id: restaurant._id, owner: req.user?._id });
        res.status(201).json({
            message: "Restaurant created successfully and is pending approval.",
            restaurant,
        });

    } catch (error) {
        console.error("Error creating owner restaurant:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// Update owner restaurant
// Put /api/owner/restaurants
export const updateOwnerRestaurant = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const restaurant = await Restaurant.findOne({ _id: req.params.id, owner: req.user?._id });
        if (!restaurant) {
            res.status(404).json({ message: "Restaurant not found." });
            return;
        }
        const { name, description, priceRange, chef, tags, availableSlots, totalSeats, image, address, location, cuisine, openingHours } = req.body;
        
        if(name) restaurant.name = name;
        if(description) restaurant.description = description;
        if(priceRange) restaurant.priceRange = priceRange;
        if(chef) restaurant.chef = chef;
        if(location) restaurant.location = location;
        if(tags !== undefined) restaurant.tags = parseCommaSeparatedValues(tags) ?? [];
        if(availableSlots !== undefined) restaurant.availableSlots = parseCommaSeparatedValues(availableSlots) ?? [];
        if (totalSeats !== undefined) {
            const seats = Number(totalSeats);
            if (!Number.isInteger(seats) || seats < 1) {
                res.status(400).json({ message: "Total capacity must be a whole number greater than zero." });
                return;
            }
            restaurant.totalSeats = seats;
        }
        if(address) restaurant.address = address;
        if(cuisine) restaurant.cuisine = cuisine;
        // handel a new image uplode if any
        
        if (req.file) {
            if (!isCloudinaryConfigured) {
                res.status(500).json({ message: "Cloudinary is not configured on the server." });
                return;
            }

            const result = await uploadToClodinary(req.file.buffer);
            restaurant.image = result.secure_url;
        }

        const updated = await restaurant.save()
        res.json(updated);


    } catch (error: any) {
        console.error("Error updating owner restaurant:", error);
        if (error?.name === "ValidationError" || error?.name === "CastError") {
            res.status(400).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: "Internal server error" });
    }
}

// Get bookings for the authenticated owner's restaurant.
// GET /api/owners/bookings
export const getOwnerBookings = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user?._id }).select("_id");
        if(!restaurant){
            res.status(404).json({message:"Restaurant profile not found"});
            return;
        }

        const bookings = await Booking.find({ restaurant: restaurant._id })
            .populate("user", "name email")
            .sort({ date: -1, time: -1 })
            .lean();

        // Keep the owner endpoint aligned with the customer bookings endpoint.
        // This gives both dashboards the same predictable response shape.
        res.status(200).json({ bookings });
        
    } catch (error) {
        console.error("Error fetching owner restaurant bookings:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// Update the status of a booking
// Put /api/owner/bookings/:id/status
export const updateBookingStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { status } = req.body;
        if(!status || !["confirmed", "cancelled", "completed"].includes(status)){
            res.status(400).json({ message: "Please enter a valid booking status." });
            return;
        }
        const booking = await Booking.findById(req.params.id);
        if(!booking){
            res.status(404).json({ message: "Booking not found." });
            return;
        }
        // verify booking belong to the owner's restaurant
        const restaurant = await Restaurant.findById(booking.restaurant)
        if( !restaurant || restaurant.owner.toString() !== req.user?._id?.toString()){
            res.status(403).json({ message: "Not authorized to update this booking." });
            return;
        }
        booking.status = status;
        await booking.save();
        res.status(200).json({ message: "Booking status updated successfully.", booking });



    } catch (error) {
        console.error("Error updating booking status:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}
        
