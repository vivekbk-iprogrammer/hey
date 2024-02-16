const { postModel } = require("../models/postModel")
const { userModel } = require('../models/userModel');
const path = require('path');
const fs = require('fs');
const { v4: uuid } = require('uuid');


const createPost = async (req, res) => {
    try {
        // console.log(req.files)
        const { title, category, description } = req.body;
        if (!title || !category || !description) {
            return res.status(422).json({ error: "Fill in all fields and choose thumbnail" })
        }

        const { thumbnail } = req.files;
        if (thumbnail.size > 2000000) {
            return res.status(422).json({ error: "Thumbnail too big, File should be less than 2mb." })
        };
        let fileName = thumbnail.name;
        let splittedFilename = fileName.split('.');
        let newFileName = splittedFilename[0] + uuid() + "." + splittedFilename[splittedFilename.length - 1];
        thumbnail.mv(path.join(__dirname, '..', '/uploads', newFileName), async (error) => {
            if (error) {
                return res.status(422).json(error)

            } else {
                const newPost = await postModel.create({ title, category, thumbnail: newFileName, creator: req.user.id, description });
                if (!newPost) {
                    return res.status(422).json({ error: "Post couldn't be created" })
                };
                //find user and increase post count by 1
                const currentUser = await userModel.findById(req.user.id);
                const userPostCount = currentUser.posts + 1;
                await userModel.findByIdAndUpdate(req.user.id, { posts: userPostCount });
                return res.status(201).json(newPost);
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(422).json({ error: "Internal Server Error" })
    }
}

const getPosts = async (req, res) => {
    try {
        const posts = await postModel.find().sort({ updatedAt: -1 });
        return res.status(200).json(posts);
    } catch (error) {
        console.log(error);
        return res.status(422).json({ error: "Internal Server Error" })
    }
}

const getPost = async (req, res) => {
    try {
        const postId = req.params.id;
        const post = await postModel.findById(postId)
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }
        return res.status(200).json(post);
    } catch (error) {
        console.log(error);
        return res.status(422).json({ error: "Internal Server Error" })
    }
}

const getCatPosts = async (req, res) => {
    try {
        const { category } = req.params;
        const catPosts = await postModel.find({ category }).sort({ createdAt: -1 });
        if (!catPosts) {
            return res.status(404).json({ error: "Post not found" });
        }
        return res.status(200).json(catPosts);
    } catch (error) {
        console.log(error);
        return res.status(422).json({ error: "Internal Server Error" })
    }
}

const getUserPosts = async (req, res) => {
    try {
        const { id } = req.params;
        const posts = await postModel.find({ creator: id }).sort({ createdAt: -1 });
        if (!posts) {
            return res.status(404).json({ error: "Post not Exists" });
        }
        return res.status(200).json(posts)
    } catch (error) {
        console.log(error);
        return res.status(422).json({ error: "Internal Server Error" })
    }
}

const editPost = async (req, res, next) => {
    try {
        let fileName;
        let newFileName;
        let updatedPost;
        const postId = req.params.id;
        let { title, category, description } = req.body;
        if (!title || !category || description.length < 12) {
            return res.status(422).json({ error: "Fill in all fields." });
        };
        if (!req.files) {
            updatedPost = await postModel.findByIdAndUpdate(postId, { title, category, description }, { new: true })
        } else {
            //get old post from database
            const oldPost = await postModel.findById(postId);
            //delete old thumbnail from upload
            fs.unlink(path.join(__dirname, '..', 'uploads', oldPost.thumbnail, async (error) => {
                if (error) {
                    return res.status(422).json(error);
                }
            }));
            //upload new thumbanail
            const { thumbnail } = req.files;
            if (thumbnail.size > 2000000) {
                return res.status(422).json({ error: "Thumbnail too big. Should be less then 2mb." });
            };

            fileName = thumbnail.name;
            let splittedFilename = fileName.split('.');
            newFileName = splittedFilename[0] + uuid() + "." + splittedFilename[splittedFilename.length - 1];
            thumbnail.mv(path.join(__dirname, '..', 'uploads', newFileName), async (error) => {
                if (error) {
                    return res.status(422).json(error);
                };

            })
            updatedPost = await postModel.findByIdAndUpdate(postId, { title, category, description, thumbnail: newFileName }, { new: true })
        }

        if (!updatedPost) {
            return res.status(422).json({ error: "Post couldn't be updated" });
        }

        return res.status(200).json(updatedPost)

    } catch (error) {
        console.log(error);
        return res.status(422).json({ error: "Internal server error" })
    }

}

const deletePost = async (req, res) => {
    try {
        const postId = req.params.id;
        if (!postId) {
            return res.status(400).json({ error: "Post unavailable" });
        }
        const post = await postModel.findById(postId);
        const fileName = post?.thumbnail;
        if (req.user.id == post.creator) {
            //delete thumbnail from uploads folder
            fs.unlink(path.join(__dirname, '..', 'uploads', fileName), async (error) => {
                if (error) {
                    return res.status(422).json(error);
                } else {
                    await postModel.findByIdAndDelete(postId);
                    //find user and reduce post count by 1;
                    const currentUser = await userModel.findById(req.user.id);
                    const userPostCount = currentUser?.posts - 1;
                    await userModel.findByIdAndUpdate(req.user.id, { posts: userPostCount })
                }
            })
            return res.status(200).json({ msg: "Post deleted successfully" });
        }
    } catch (error) {
        console.log(error);
        return res.status(422).json({ error: "Internal server error" })

    }
}

module.exports = { createPost, getPost, getPosts, getCatPosts, getUserPosts, editPost, deletePost }