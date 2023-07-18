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
        status: {
            type: String,
            enum: ['accepted', 'pending', 'rejected'],
            default: 'pending'
        }
    },
    {
        // Enable virtual fields in JSON representation
        toJSON: {
            virtuals: true,
        },
        // Enable virtual fields in object representation
        toObject: {
            virtuals: true,
        },
        // Enable automatic timestamps for createdAt and updatedAt fields
        timestamps: true,
    }
);

// Transform Methods
requestSchema.options.toJSON.transform = function (doc, ret) {
    delete ret._id;
    delete ret.__v;
    delete ret.updatedAt;
    return ret;
};

requestSchema.options.toObject.transform = function (doc, ret) {
    delete ret._id;
    delete ret.__v;
    delete ret.updatedAt;
    return ret;
};

// Static methods

// Static method to create a new request
requestSchema.statics.createRequest = async function (requestData) {
    try {
        const { senderId, receiverId } = requestData;
        // Create and return the new request
        const request = await Request.create({ sender: senderId, receiver: receiverId });
        return request;
    } catch (error) {
        // If an error occurs during the process, throw an error with a specific message
        throw new Error(error?.message);
    }
};


// Create models from the schemas
const Request = mongoose.model("Request", requestSchema);

// Export the models
export default Request;
