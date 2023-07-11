// Import required modules
import mongoose from "mongoose";


// Define the Request schema
const requestSchema = new mongoose.Schema(
    {
        // Sender user reference
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // Receiver user reference
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // Request status
        status: {
            type: String,
            enum: ["pending", "accepted", "rejected"],
            default: "pending",
        },
    },
    {
        timestamps: true,
    }
);

// Create models from the schemas
const Request = mongoose.model("Request", requestSchema);

// Export the models
export default Request;
