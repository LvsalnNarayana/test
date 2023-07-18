import express from 'express';
import {
    createComment,
    updateComment,
    deleteComment,
    getCommentById,
    likeComment,
    unlikeComment,
} from '../controllers/commentController.js';

const commentRouter = (io) => {
    const router = express.Router();

    // GET COMMENT BY ID
    router.get('/:postId/comments/:commentId', (req, res) => {
        getCommentById(req, res);
    });

    // CREATE COMMENT
    router.post('/posts/:postId/comments/create-comment', (req, res) => {
        createComment(req, res);
    });

    // UPDATE COMMENT
    router.post('/posts/:postId/comments/:commentId/update', (req, res) => {
        updateComment(req, res);
    });

    // DELETE COMMENT
    router.post('/posts/:postId/comments/:commentId/delete', (req, res) => {
        deleteComment(req, res);
    });

    // LIKE COMMENT
    router.post('/posts/:postId/comments/:commentId/like', (req, res) => {
        likeComment(req, res);
    });

    // UNLIKE COMMENT
    router.post('/posts/:postId/comments/:commentId/unlike', (req, res) => {
        unlikeComment(req, res);
    });

    return router;
};

export default commentRouter;
