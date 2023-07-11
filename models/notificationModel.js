// Import required modules
import mongoose from "mongoose";


// Define the Notification schema
const notificationSchema = new mongoose.Schema(
    {
        // User reference
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // Notification message
        message: {
            type: String,
            required: true,
        },
        // Notification type
        type: {
            type: String,
            required: true,
        },
        // Read status
        read: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;