import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import connectDB from "./config/db.js";

import dns from "dns";
import authRouter from "./routes/authRoute.js";
import restaurantRouter from "./routes/restaurantRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";


dns.setServers(["1.1.1.1","8.8.8.8"]);

const app = express();

app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;

app.get("/", (req: Request, res: Response) => {
    res.send("Server is Live!");
});

app.use("/api/auth",authRouter)
app.use("/api/restaurants",restaurantRouter)
app.use("/api/bookings", bookingRouter);

// Global Error Handler
app.use((err:Error, req:Request, res:Response, next:NextFunction)=>{
    console.error("Unhandle Error",err);
    res.status(500).json({
        message: err.message ||"Internalserver Error",
        stack:process.env.NODE_ENV ==="production"? undefined : err.stack,
    })

})



const startServer = async () => {
    try {
        await connectDB();

        app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}`);
        });

    } catch (error) {
        console.log("Database connection failed:", error);
        process.exit(1);
    }
};

startServer();