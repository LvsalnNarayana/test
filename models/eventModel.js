// Import required modules
import mongoose from "mongoose";


// Define the Event schema
const eventSchema = new mongoose.Schema(
    {
        // User reference
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // Event title
        title: {
            type: String,
            required: true,
        },
        // Event description
        description: {
            type: String,
            required: true,
        },
        // Event date
        date: {
            type: Date,
            required: true,
        },
        // Event location
        location: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const Event = mongoose.model("Event", eventSchema);
export default Event;