import jwt from "jsonwebtoken";
import { User } from "../models/user.js";
import bcrypt from "bcrypt";
// Generate JWT Token
const generateToken = (id) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is not defined");
    }
    return jwt.sign({ id }, secret, { expiresIn: "30d" });
};
// Register User
// POST /api/auth/register
export const registerUser = async (req, res) => {
    try {
        const { name, email, password, phone, role } = req.body;
        if (!name || !email || !password) {
            res.status(400).json({
                message: "Please enter all required fields"
            });
            return;
        }
        const userExists = await User.findOne({ email });
        if (userExists) {
            res.status(400).json({
                message: "User already exists"
            });
            return;
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            phone,
            role: role || "user",
        });
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            token: generateToken(user._id.toString())
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: error.message
        });
    }
};
// Login User
// POST /api/auth/login
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({
                message: "Please provide email and password"
            });
            return;
        }
        const user = await User.findOne({ email });
        if (!user) {
            res.status(401).json({
                message: "Invalid email or password"
            });
            return;
        }
        const isMatch = await bcrypt.compare(password, user.password || "");
        if (!isMatch) {
            res.status(401).json({
                message: "Invalid email or password"
            });
            return;
        }
        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            token: generateToken(user._id.toString())
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: error.message
        });
    }
};
// Get User Profile
// GET /api/auth/me
// Private Route
export const getMe = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                message: "Not authorized"
            });
            return;
        }
        res.status(200).json(req.user);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: error.message
        });
    }
};
