import Comment from '../models/commentModel.js';
import User from '../models/userModel.js';
import asyncHandler from 'express-async-handler';
import Post from '../models/postModel.js';

export const getCommentById = asyncHandler(async (req, res) => {
    try {
        const comment = await Comment.getCommentById(
            req?.params?.postId,
            req?.params?.commentId,
            req?.session?.user?.id
        );
        const user = await User.findById(req?.session?.user?.id).select('saved_comments');
        if (comment && user) {
            const isSaved = user?.saved_comments.includes(req?.params?.commentId);
            res.status(200).json({ ...comment, saved: isSaved });
        } else {
            res.status(404).json({ success: false, message: 'Comment not found' });
        }
    } catch (error) {
        res.status(404).json({ success: false, message: error?.message });
    }
});

// CREATE COMMENT
export const createComment = asyncHandler(async (req, res) => {
    const commentData = {
        postId: req?.params?.postId,
        comment: req?.body?.comment,
    };

    try {
        // Create a new comment
        const comment = await Comment.createComment(commentData, req?.session?.user?.id);
        // Add the comment to the PostSchema comments array
        const post = await Post.findOneAndUpdate(
            { _id: commentData?.postId },
            { $push: { comments: comment.id } },
            { new: true }
        );
        if (comment && post) {
            res.status(200).json(comment);
        } else {
            res.status(500).json({ success: false, message: 'Error creating comment' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error?.message });
    }
});

export const updateComment = asyncHandler(async (req, res) => {
    try {
        const commentData = {
            commentId: req?.params?.commentId,
            UpdatedComment: req?.body?.UpdatedComment,
            postId: req?.params?.postId,
        };
        const comment = await Comment.updateComment(commentData, req?.session?.user?.id);
        res.status(200).json(comment);
    } catch (error) {
        res.status(500).json({ success: false, message: error?.message });
    }
});

// DELETE COMMENT
export const deleteComment = asyncHandler(async (req, res) => {
    try {
        const { commentId, postId } = req.params;
        // Find the comment to be deleted
        const comment = await Comment.findOne({ _id: commentId, postId: postId }).populate('user', 'username').exec();
        if (!comment) {
            res.status(404).json({ success: false, message: 'Comment not found' });
            return;
        }
        // Check if the comment belongs to the current user
        if (comment?.user?.id !== req.session.user.id) {
            res.status(401).json({ success: false, message: 'You are not authorized to delete this comment' });
            return;
        }
        // Remove the comment from the PostSchema comments array
        await Post.findOneAndUpdate(
            { _id: postId, comments: commentId },
            { $pull: { comments: commentId } },
            { new: true }
        );
        // Delete the comment
        await Comment.deleteComment(commentId, postId, req?.session?.user?.id);
        res.status(200).json({ success: true, message: 'Comment deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error?.message });
    }
});

export const likeComment = asyncHandler(async (req, res) => {
    try {
        const likes = await Comment.likeComment(req?.params?.postId, req?.params?.commentId, req?.session?.user?.id);
        if (likes) {
            res.status(200).json(likes);
        } else {
            res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error?.message });
    }
});

export const unlikeComment = asyncHandler(async (req, res) => {
    try {
        const likes = await Comment.unlikeComment(req?.params?.postId, req?.params?.commentId, req?.session?.user?.id);
        if (likes) {
            res.status(200).json(likes);
        } else {
            res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error?.message });
    }
});
