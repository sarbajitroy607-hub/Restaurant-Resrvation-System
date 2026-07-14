import jwt from "jsonwebtoken";
import { User } from "../models/user.js";
export const protect = async (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) {
        res.status(401).json({ message: "No authorization token provided" });
        return;
    }
    const token = authorization.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = typeof decoded === "object" && decoded !== null && "id" in decoded ? String(decoded.id) : undefined;
        if (!userId) {
            res.status(401).json({ message: "Invalid token payload" });
            return;
        }
        const user = await User.findById(userId).select("-password");
        if (!user) {
            res.status(401).json({ message: "Not authorized, user not found" });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        console.error("auth Middleware Error:", error);
        res.status(401).json({ message: error?.message || "Not authorized" });
    }
};
export const adminOnly = (req, res, next) => {
    if (req.user?.role === "admin") {
        next();
    }
    else {
        res.status(403).json({ message: "Access denied, admin role required" });
    }
};
export const ownerOnly = (req, res, next) => {
    if (req.user?.role === "owner" || req.user?.role === "admin") {
        next();
    }
    else {
        res.status(403).json({ message: "Access denied, owner or admin role required" });
    }
};
