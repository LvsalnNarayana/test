// Import required modules
import mongoose from "mongoose";


// Define the Post schema
const postSchema = new mongoose.Schema(
    {
        // User reference
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // Post content
        content: {
            type: String,
            required: true,
        },
        // Comments
        comments: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
                content: {
                    type: String,
                    required: true,
                },
            },
        ],
        // Likes
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        ],
    },
    {
        timestamps: true,
    }
);
const Post = mongoose.model("Post", postSchema);

export default Post;