import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import dns from "dns";
import authRouter from "./routes/authRoutes.js";
import restaurantRouter from "./routes/restaurantRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import ownerRouter from "./routes/ownerRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
dns.setServers(["1.1.1.1", "8.8.8.8"]);
const app = express();
app.use(cors());
app.use(express.json());
// Vercel reuses a function instance across requests when possible. This
// middleware ensures each fresh instance has an active database connection.
app.use(async (_req, _res, next) => {
    try {
        await connectDB();
        next();
    }
    catch (error) {
        next(error);
    }
});
app.get("/", (req, res) => {
    res.send("Server is Live!");
});
app.use("/api/auth", authRouter);
app.use("/api/restaurants", restaurantRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/owners", ownerRouter);
app.use("/api/admin", adminRouter);
// Global Error Handler
app.use((err, req, res, next) => {
    console.error("Unhandled Error", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    const stack = err instanceof Error ? err.stack : undefined;
    res.status(500).json({
        message,
        stack: process.env.NODE_ENV === "production" ? undefined : stack,
    });
});
// Vercel imports this Express app as a serverless function. Keep the listener
// exclusively for local development.
if (!process.env.VERCEL) {
    const port = process.env.PORT || 5000;
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}
export default app;
