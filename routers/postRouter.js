import { createPost, deletePost, getPostById, likePost, savePost, unlikePost, unsavePost, updatePost } from '../controllers/postController.js';
import express from 'express';
const postRouter = (io) => {
    const router = express.Router();
    //GET POST
    router.get("/posts/:postId", (req, res) => {
        getPostById(req, res, io)
    });

    //CREATE POST
    router.post("/posts/create-post", (req, res) => {
        createPost(req, res, io);
    });

    //DELETE POST
    router.post("/posts/:postId/delete", (req, res) => {
        deletePost(req, res, io)
    });

    //UPDATE POST
    router.post("/posts/:postId/update", (req, res) => {
        updatePost(req, res, io)
    });
    //LIKE POST
    router.post("/posts/:postId/like", (req, res) => {
        likePost(req, res, io);
    });
    //UNLIKE POST
    router.post("/posts/:postId/unlike", (req, res) => {
        unlikePost(req, res, io)
    });
    //SAVE POST
    router.post("/posts/:postId/save-post", (req, res) => {
        savePost(req, res, io)
    });

    //UNSAVE POST
    router.post("/posts/:postId/unsave-post", (req, res) => {
        unsavePost(req, res, io)
    });

    return router;
}
export default postRouter;