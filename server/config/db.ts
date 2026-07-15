import mongoose from "mongoose";

let connectionPromise: Promise<typeof mongoose> | undefined;

const connectDB = async () => {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        throw new Error("MONGODB_URI is not configured");
    }

    if (!connectionPromise) {
        connectionPromise = mongoose.connect(uri).then((connection) => {
            console.log(`MongoDB connected: ${connection.connection.host}`);
            return connection;
        }).catch((error) => {
            connectionPromise = undefined;
            throw error;
        });
    }

    return connectionPromise;
};

export default connectDB;
