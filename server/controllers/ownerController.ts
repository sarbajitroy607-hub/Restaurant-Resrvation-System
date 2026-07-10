
import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.js";
import { Booking } from "../models/Booking.js";
import { Restaurant } from "../models/Restaurant.js";
import { v2 as cloudinary } from "cloudinary";
import upload from "../config/multer.js";




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

        const existingRestaurant = await Restaurant.findOne({ owner: req.user?._id });
        if (existingRestaurant) {
            res.status(400).json({ message: "You already have a restaurant." });
            return;
        }
        const { name, description, priceRange, chef, tags, availableSlots, totalSeats, image, address, location, cuisine, openingHours } = req.body;

        if (!name || !description || !priceRange || !chef || !tags || !availableSlots || !totalSeats || !image || !address || !location || !cuisine || !openingHours) {
            res.status(400).json({ message: "All fields are required." });
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
           const result = await uploadToClodinary(req.file.buffer);
           imageUrl = result.secure_url;
        }
        // setup parsed tag and slots
        const parsedTags = typeof tags === "string" ? tags.split(",").map((tag: string) => tag.trim()) : tags;
        const parsedAvailableSlots = typeof availableSlots === "string" ? JSON.parse(availableSlots) : availableSlots;
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

        const restaurant = await Restaurant.findOne({ owner: req.user?._id });
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
        if(tags) restaurant.tags = typeof tags === "string" ? tags.split(",").map((tag: string) => tag.trim()) : tags;
        if(availableSlots) restaurant.availableSlots = typeof availableSlots === "string" ? JSON.parse(availableSlots) : availableSlots;
        if(totalSeats) restaurant.totalSeats = totalSeats ? Number(totalSeats) : restaurant.totalSeats;
        if(address) restaurant.address = address;
        if(cuisine) restaurant.cuisine = cuisine;
        if(availableSlots){
            restaurant.availableSlots =
            typeof availableSlots === "string" ? JSON.parse(availableSlots) : availableSlots;
        }

        // handel a new image uplode if any
        
        if (req.file) {
           const result = await uploadToClodinary(req.file.buffer);
           restaurant.image = result.secure_url;
        }

        const updated = await restaurant.save()
        res.json(updated);


    } catch (error) {
        console.error("Error updating owner restaurant:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// get booking for owner's restaurant
// Get /api/owner/restaurants/:restaurantId/bookings
export const getOwnerBookings = async (req: AuthRequest, res: Response): Promise<void> => {
    try {

        const restaurant = await Restaurant.findOne({ owner: req.user?._id});
        if(!restaurant){
            res.status(404).json({message:"Restaurant profile not found"});
            return;
        }

        const booking = await Booking.find({restaurant: restaurant._id}).populate("user","name email").sort({date:-1,time:-1});
        res.status(200).json(booking);
        
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
        