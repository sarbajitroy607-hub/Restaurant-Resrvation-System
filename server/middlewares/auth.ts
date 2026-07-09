import { NextFunction, Request, Response } from "express"
import jwt from "jsonwebtoken"
import { User, IUser } from "../models/user.js"

export interface AuthRequest extends Request {
    user?: IUser
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const authorization = req.headers.authorization
    if (!authorization?.startsWith("Bearer ")) {
        res.status(401).json({ message: "No authorization token provided" })
        return
    }

    const token = authorization.split(" ")[1]

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string)
        const userId = typeof decoded === "object" && decoded !== null && "id" in decoded ? String((decoded as any).id) : undefined

        if (!userId) {
            res.status(401).json({ message: "Invalid token payload" })
            return
        }

        const user = await User.findById(userId).select("-password")

        if (!user) {
            res.status(401).json({ message: "Not authorized, user not found" })
            return
        }

        req.user = user
        next()
    } catch (error: any) {
        console.error("auth Middleware Error:", error)
        res.status(401).json({ message: error?.message || "Not authorized" })
    }
}

export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (req.user?.role === "admin") {
        next()
    } else {
        res.status(403).json({ message: "Access denied, admin role required" })
    }
}

export const ownerOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (req.user?.role === "owner" || req.user?.role === "admin") {
        next()
    } else {
        res.status(403).json({ message: "Access denied, owner or admin role required" })
    }
}
