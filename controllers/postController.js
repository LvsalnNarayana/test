import Post from '../models/postModel.js';
import User from '../models/userModel.js';
import asyncHandler from 'express-async-handler';
import { GetUserSockets, OtherSockets } from '../utilities/serverStore.js';

export const getPostById = asyncHandler(async (req, res) => {
    try {
        const post = await Post.getPostById(req?.params?.postId, req?.session?.user?.id);
        const user = await User.findById(req?.session?.user?.id).select('saved_posts');
        if (post && user) {
            const isSaved = user?.saved_posts.includes(req?.params?.postId);
            res.status(200).json({ ...post, saved: isSaved });
        } else {
            res.status(404).json({ success: false, message: "post not found" });
        }
    } catch (error) {
        res.status(404).json({ success: false, message: error?.message });
    }
})
export const createPost = asyncHandler(async (req, res, io) => {
    const postData = {
        user: req?.session?.user?.id,
        post_type: req?.body?.post_type,
        description: req?.body?.description,
        images: ['lorem', 'ipsum']
    }
    try {
        const post = await Post.createPost(postData);
        const sockets = GetUserSockets(req?.session?.user?.id);
        const otherSockets = OtherSockets(req?.session?.user?.id);

        if (post) {
            sockets.forEach(socket => {
                io.to(socket).emit('post-create-user-update', { ...post, likedByUser: false, owner: true });
            });
            otherSockets.forEach(socket => {
                io.to(socket).emit('post-create-global-update', { ...post });
            });
            res.status(200).json(post);
        } else {
            res.status(500).json({ success: false, message: "error creating post" })
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error?.messages })
    }
})
export const updatePost = asyncHandler(async (req, res) => {
    try {
        const postData = {
            post_type: req?.body?.post_type,
            description: req?.body?.description,
            images: req?.body?.images
        }
        const post = await Post.updatePost(req?.params?.postId, postData, req?.session?.user?.id);
        res.status(200).json(post);
    } catch (error) {
        res.status(500).json({ success: false, message: error?.message });
    }
})
export const deletePost = asyncHandler(async (req, res) => {

    try {
        const deletePost = await Post.deletePost(req?.params?.postId, req?.session?.user?.id);
        if (deletePost) {
            res.status(200).json(deletePost);
        } else {
            res.status(500).json({ success: false, message: "something went wrong please trya again!" })
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error?.message })
    }
})
export const likePost = asyncHandler(async (req, res, io) => {
    try {
        const updatedPost = await Post.likePost(req?.params?.postId, req?.session?.user?.id);
        const sockets = GetUserSockets(req?.session?.user?.id);
        const otherSockets = OtherSockets(req?.session?.user?.id);
        const notificationSockets = GetUserSockets(updatedPost?.notification?.userId.toString());
        if (updatedPost) {
            if (notificationSockets) {
                notificationSockets.forEach((socket) => {
                    io.to(socket).emit('notification-update', { ...updatedPost?.notification.toObject() });
                })
            }
            sockets.forEach(socket => {
                io.to(socket).emit('post-like-user-update', { ...updatedPost?.post, likedByUser: true });
            });
            otherSockets.forEach(socket => {
                io.to(socket).emit('post-like-global-update', { ...updatedPost?.post });
            });
            res.status(200).json(updatedPost?.post);
        } else {
            res.status(500).json({ success: false, message: "something went wrong please trya again!" })
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error?.message })
    }
})
export const unlikePost = asyncHandler(async (req, res, io) => {
    try {
        const updatedPost = await Post.unlikePost(req?.params?.postId, req?.session?.user?.id);
        const sockets = GetUserSockets(req?.session?.user?.id);
        const otherSockets = OtherSockets(req?.session?.user?.id);
        if (updatedPost) {
            sockets.forEach(socket => {
                io.to(socket).emit('post-like-user-update', { ...updatedPost?.post, likedByUser: false });
            });
            otherSockets.forEach(socket => {
                io.to(socket).emit('post-like-global-update', { ...updatedPost?.post });
            });
            res.status(200).json(updatedPost);
        } else {
            res.status(500).json({ success: false, message: "something went wrong please trya again!" })
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error?.message })
    }
})
export const savePost = asyncHandler(async (req, res) => {
    try {
        const postId = req?.params?.postId;
        const sessionUser = req?.session?.user?.id;
        // Find the user
        const user = await User.findById(sessionUser);

        if (!user) {
            res.status(404).json({ success: false, message: "User not found" });
        }

        // Check if the post is already saved
        if (user.saved_posts.includes(postId)) {
            res.status(400).json({ success: false, message: "Post is already saved" });
        }

        // Save the post
        await User.findOneAndUpdate(
            { _id: sessionUser, saved_posts: { $ne: postId } },
            { $addToSet: { saved_posts: postId } },
            { new: true }
        ).select('saved_posts').exec();

        res.status(200).json({ success: true, message: "Post saved successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error?.message });
    }
});

export const unsavePost = asyncHandler(async (req, res) => {
    try {
        const postId = req?.params?.postId;
        const sessionUser = req?.session?.user?.id;

        // Find the user
        const user = await User.findById(sessionUser);

        if (!user) {
            res.status(404).json({ success: false, message: "User not found" });
        }

        // Check if the post is saved
        if (!user.saved_posts.includes(postId)) {
            res.status(400).json({ success: false, message: "Post is not saved" });
        }

        // Remove the post from saved_posts array
        await User.findOneAndUpdate(
            { _id: sessionUser, saved_posts: postId },
            { $pull: { saved_posts: postId } },
            { new: true }
        ).select('saved_posts').exec();

        res.status(200).json({ success: true, message: "Post unsaved successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error?.message });
    }
});
