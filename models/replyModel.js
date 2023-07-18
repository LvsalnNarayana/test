// Import required modules
import mongoose from 'mongoose';

// Define the Post schema
const replySchema = new mongoose.Schema(
    {

        UserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        commentId: {
            type: String
        },
        postId: {
            type: String
        },
        reply: {
            type: String,
        },
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                default: [],
            },
        ]
    },
    {
        toJSON: {
            virtuals: true,
        },
        toObject: {
            virtuals: true,
        },
        timestamps: true,
    }
);
// Static methods

// Create a new reply
replySchema.statics.createReply = async function (replyData, sessionUser) {
    try {
        const { commentId, postId, reply } = replyData;

        // Create a new reply
        const newReply = await Reply.create({
            UserId: sessionUser,
            commentId,
            postId,
            reply,
        });

        return newReply.toObject();
    } catch (error) {
        throw new Error('Failed to create reply: ' + error.message);
    }
};

// Update an existing reply
replySchema.statics.updateReply = async function (replyData, sessionUser) {
    const { replyId, UpdatedReply, commentId, postId } = replyData;
    try {
        // Find the reply by replyId
        const reply = await Reply.findOne({ _id: replyId, commentId, postId }).populate('UserId', 'username').exec();
        if (!reply) {
            throw new Error('Reply not found.');
        }
        if (!(reply?.UserId?.id === sessionUser)) {
            throw new Error('You are not authorized to update the reply.');
        }
        // Update the reply
        const newReply = await Reply.findOneAndUpdate({ _id: replyId, commentId, postId }, { reply: UpdatedReply }, { new: true }).exec();
        return newReply;
    } catch (error) {
        throw new Error('Failed to update reply: ' + error.message);
    }
};

// Delete a reply
replySchema.statics.deleteReply = async function (replyId, commentId, postId, sessionUser) {
    try {
        // Find the reply by replyId
        const reply = await Reply.findOne({ _id: replyId, commentId, postId }).populate('UserId', 'username').exec();
        if (!reply) {
            throw new Error('Reply not found.');
        }
        if (!(reply?.UserId?.id === sessionUser)) {
            throw new Error('You are not authorized to delete the reply.');
        }
        // Delete the reply
        await Reply.findOneAndDelete({ _id: replyId, commentId, postId });
        return { success: true, message: 'Reply deleted successfully' };
    } catch (error) {
        throw new Error('Failed to delete reply: ' + error.message);
    }
};

// Get a reply by postId, commentId, and replyId
replySchema.statics.getReplyById = async function (postId, commentId, replyId, sessionUser) {
    try {
        const reply = await Reply.findOne({ _id: replyId, commentId, postId }).populate('UserId', 'username').exec();
        if (!reply) {
            throw new Error('Reply not found.');
        }
        const replyObject = reply.toObject();
        replyObject.author = reply.UserId?.id === sessionUser;
        return replyObject;
    } catch (error) {
        throw new Error('Failed to get reply by ID: ' + error.message);
    }
};

// Like a reply
replySchema.statics.likeReply = async function (replyId, sessionUser) {
    try {
        const reply = await Reply.findOneAndUpdate(
            { _id: replyId, likes: { $ne: sessionUser } },
            { $push: { likes: sessionUser } },
            { new: true }
        )
            .select('likes')
            .exec();
        if (!reply) {
            throw new Error('Reply not found or you have already liked the reply.');
        }
        return reply.toObject();
    } catch (error) {
        throw new Error('Failed to like reply: ' + error.message);
    }
};

// Unlike a reply
replySchema.statics.unlikeReply = async function (replyId, sessionUser) {
    try {
        const reply = await Reply.findOneAndUpdate(
            { _id: replyId, likes: sessionUser },
            { $pull: { likes: sessionUser } },
            { new: true }
        )
            .select('likes')
            .exec();
        if (!reply) {
            throw new Error('Reply not found or you have not liked the reply.');
        }
        return reply.toObject();
    } catch (error) {
        throw new Error('Failed to unlike reply: ' + error.message);
    }
};

// Create the Reply model
const Reply = mongoose.model('Reply', replySchema);

// Export the model
export default Reply;
