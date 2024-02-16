const express = require('express');
const { createPost, getPost, getPosts, getCatPosts, getUserPosts, editPost, deletePost, } = require('../controllers/postController');
const { authMiddleware } = require('../middlewares/authMiddleware')
const postRouter = express.Router();


postRouter.post('/', authMiddleware, createPost);
postRouter.get('/', getPosts);
postRouter.get('/:id', getPost);
postRouter.get('/categories/:category', getCatPosts);
postRouter.get('/users/:id', authMiddleware, getUserPosts);
postRouter.patch('/:id', authMiddleware, editPost);
postRouter.delete('/:id', authMiddleware, deletePost);



module.exports = { postRouter }