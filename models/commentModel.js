// Import required modules
import mongoose from 'mongoose';
import Notification from './notificationModel.js';
import Post from './postModel.js';
import User from './userModel.js';

// Define the Comment schema
const commentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        postId: {
            type: String,
        },
        comment: {
            type: String,
        },
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                default: [],
            },
        ],
        replies: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Reply',
                default: [],
            },
        ],
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
// Transform Methods
commentSchema.options.toJSON.transform = function (doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
};

commentSchema.options.toObject.transform = function (doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
};
commentSchema.pre(/^find/, function (next) {
    this.populate('user', 'username');
    // this.populate('replies')
    next()
});
// Static methods

// Create a new comment
commentSchema.statics.createComment = async function (commentData, sessionUser) {
    try {
        const { postId, comment } = commentData;
        const post = await Post.findById(postId).populate('user', 'username').select('user').exec();
        const user = await User.findById(sessionUser).select('username').exec();
        if (!post) {
            throw new Error("Post Not Found")
        }
        if (!user) {
            throw new Error("User Not Found")
        }
        // Create a new comment
        const newComment = await Comment.create({
            user: sessionUser,
            postId,
            comment,
        });
        await Post.findOneAndUpdate({ _id: newComment?.postId, user: user }, { $push: { comments: newComment.id } })
        if (post?.user?.id !== sessionUser) {
            const notificationData = {
                message: `${user?.username} commented on your post`,
                postId: postId,
                userId: sessionUser,
                sender: postId
            };
            const notification = await Notification.createPostCommentNotification(notificationData);
            if (notification) {
                return { comment: newComment.toObject(), notification: notification };
            } else {
                throw new Error("Error creating post");
            }
        } else {
            return { comment: newComment }
        }
    } catch (error) {
        throw new Error('Failed to create comment: ' + error.message);
    }
};

// Update an existing comment
commentSchema.statics.updateComment = async function (commentData, sessionUser) {
    try {
        const { commentId, UpdatedComment, postId } = commentData;
        // Find the comment by commentId
        const comment = await Comment.findOne({ _id: commentId, postId: postId }).populate('user', 'username').exec();
        if (!comment) {
            throw new Error('Comment not found.');
        }
        if (!(comment?.user?.id === sessionUser)) {
            throw new Error('You are not authorized to update Comment comment.');
        }
        // Update the comment
        const newComment = await Comment.findOneAndUpdate({ _id: commentId, postId: postId }, { comment: UpdatedComment }, { new: true }).exec()
        return newComment;
    } catch (error) {
        throw new Error('Failed to update comment: ' + error.message);
    }
};

// Delete a comment
commentSchema.statics.deleteComment = async function (commentId, postId, sessionUser) {
    try {
        // Find the comment by commentId
        const comment = await Comment.findOne({ _id: commentId, postId: postId }).populate('user', 'username').exec();
        if (!comment) {
            throw new Error('Comment not found.');
        }
        if (!(comment?.user?.id === sessionUser)) {
            throw new Error('You are not authorized to delete Comment comment.');
        }
        // Delete the comment
        await Comment.findOneAndDelete({ _id: commentId, postId: postId });
        return { success: true, message: "comment deleted successfully" };
    } catch (error) {
        throw new Error('Failed to delete comment: ' + error.message);
    }
};

// Get a comment by postId and commentId
commentSchema.statics.getCommentById = async function (postId, commentId, sessionUser) {
    try {
        const comment = await Comment.findOne({ _id: commentId, postId }).populate('user', 'username').exec();
        if (!comment) {
            throw new Error('Comment not found.');
        }
        const commentObject = comment.toObject();
        commentObject.author = comment.user?.id === sessionUser;
        return commentObject;
    } catch (error) {
        throw new Error('Failed to get comment by ID: ' + error.message);
    }
};

// Like a comment
commentSchema.statics.likeComment = async function (postId, commentId, sessionUser) {
    try {
        const comment = await Comment.findOneAndUpdate(
            { _id: commentId, postId: postId, likes: { $ne: sessionUser } },
            { $push: { likes: sessionUser } },
            { new: true }
        ).populate('likes', 'username').select('likes').exec();
        if (!comment) {
            throw new Error('Comment not found or you have already liked Comment comment.');
        }
        return comment.toObject();
    } catch (error) {
        throw new Error('Failed to like comment: ' + error.message);
    }
};

// Unlike a comment
commentSchema.statics.unlikeComment = async function (postId, commentId, sessionUser) {
    try {
        const comment = await Comment.findOneAndUpdate(
            { _id: commentId, postId: postId, likes: sessionUser },
            { $pull: { likes: sessionUser } },
            { new: true }
        ).select('likes').exec();
        if (!comment) {
            throw new Error('Comment not found or you have not liked Comment comment.');
        }
        return comment.toObject();
    } catch (error) {
        throw new Error('Failed to unlike comment: ' + error.message);
    }
};

// Create the Comment model
const Comment = mongoose.model('Comment', commentSchema);

// Export the model
export default Comment;
