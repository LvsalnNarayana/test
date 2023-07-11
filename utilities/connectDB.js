import mongoose from "mongoose";
export const connectDB = async (dbUrl) => {
    try {
        const conn = await mongoose.connect(dbUrl);
        console.log(conn.connection.host);
    } catch (error) {
        console.log(error);
        process.exit(1)
    }
}