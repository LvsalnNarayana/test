import mongoose from 'mongoose';
import Joi from 'joi';
import User from './userModel.js';
import Notification from './notificationModel.js';
const postSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        post_type: {
            type: String,
            default: 'public',
            enum: ['public', 'friends', 'onlyme'],
        },
        description: {
            type: String,
        },
        images: [String],
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                default: [],
            },
        ],
        comments: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Comment',
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
postSchema.options.toJSON.transform = function (doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
};

postSchema.options.toObject.transform = function (doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
};

postSchema.pre(/^find/, function (next) {
    this.populate('user', 'username');
    this.populate('comments', '-postId')
    next();
});

const createPostSchema = Joi.object({
    user: Joi.string().required(),
    post_type: Joi.string().valid('public', 'friends', 'onlyme').default('public'),
    description: Joi.string(),
    images: Joi.array().items(Joi.string()),
});

postSchema.statics.createPost = async function (postData) {
    try {
        // Validate input data
        const validatedData = await createPostSchema.validateAsync(postData);
        // Create the post
        const post = await Post.create(validatedData);
        const user = await User.findByIdAndUpdate(postData.user, { $push: { posts: post._id } });
        await post.populate('user', 'username');
        if (post && user) {
            return post.toObject();
        } else {
            return { success: false, message: 'Error Creating Post' }
        }
    } catch (error) {
        throw new Error(error.message);
    }
};

postSchema.statics.getPostById = async function (postId, sessionUser) {
    try {
        const post = await Post.findById(postId).populate('user', 'username').exec();
        if (!post) {
            throw new Error('Post not found.');
        }
        const postObject = post.toObject();
        postObject.owner = post.user?.id === sessionUser;
        postObject.likedByUser = post.likes.includes(sessionUser);
        return postObject;
    } catch (error) {
        throw new Error('Failed to get post by ID: ' + error.message);
    }
};

postSchema.statics.getPostsByIds = async function (postIds, sessionUser) {
    try {
        const posts = await Post.find({ _id: { $in: postIds } })
            .populate('user', 'username')
            .exec();
        const postObjects = posts.map((post) => {
            const postObject = post.toObject();
            postObject.owner = post.user?.id === sessionUser;
            postObject.likedByUser = post.likes.includes(sessionUser);
            return postObject;
        });
        return postObjects;
    } catch (error) {
        throw new Error('Failed to get posts by IDs: ' + error.message);
    }
};

postSchema.statics.deletePost = async function (postId, sessionUser) {
    try {
        const post = await Post.findById(postId).populate('user', 'username').exec();
        if (!post) {
            throw new Error('Post not found.');
        }
        if (!(post.user?.id === sessionUser)) {
            throw new Error('You are not authorized to delete Post post.');
        }
        await Post.findByIdAndDelete(postId);
        return { success: true };
    } catch (error) {
        throw new Error('Failed to delete post: ' + error.message);
    }
};

postSchema.statics.updatePost = async function (postId, postData, sessionUser) {
    try {

        const post = await Post.findById(postId).populate('user', 'username').exec();
        if (!post) {
            throw new Error('Post not found.');
        }
        if (!(post.user?.id === sessionUser)) {
            throw new Error('You are not authorized to update Post post.');
        }
        const updatedPost = await Post.findByIdAndUpdate({ _id: postId }, { ...postData }, { new: true });
        return updatedPost;
    } catch (error) {
        throw new Error('Failed to update post: ' + error.message);
    }
};

postSchema.statics.likePost = async function (postId, sessionUser) {
    try {
        const post = await Post.findOneAndUpdate(
            { _id: postId, likes: { $ne: sessionUser } },
            { $addToSet: { likes: sessionUser } },
            { new: true }
        ).populate('likes', 'username').populate('user', 'username').select('likes user').exec();
        if (!post) {
            throw new Error('Post not found or you have already liked Post post.');
        }
        const user = await User.findById(sessionUser).select('username');
        if (!user) {
            throw new Error('User not found');
        }
        const mappedLikes = await Promise.all(post?.toObject()?.likes?.map(async (user) => {
            if (user?.id !== sessionUser) {
                const relation = await User.checkUserRelations(user?.id, sessionUser);
                return { ...user, ...relation }
            } else {
                return user
            }
        }))
        if (post?.user?.id !== sessionUser) {
            const message = `${user?.username} & ${post?.likes?.length - 1} liked your post`;
            const notification = await Notification.createPostLikeNotification(message, postId, post?.user?.id, user?.username);
            if (notification && mappedLikes) {
                return { post: { postId: post.toObject()?.id, likes: mappedLikes }, notification: notification };
            } else {
                throw new Error('Error Liking Post');
            }
        } else {
            return { post: { postId: post.toObject()?.id, likes: mappedLikes } }
        }
    } catch (error) {
        throw new Error('Failed to like post: ' + error.message);
    }
};

postSchema.statics.unlikePost = async function (postId, sessionUser) {
    try {
        const post = await Post.findOneAndUpdate(
            { _id: postId, likes: sessionUser },
            { $pull: { likes: sessionUser } },
            { new: true }
        ).populate('likes', 'username').select('likes').exec();
        if (!post) {
            throw new Error('Post not found or you have not liked Post post.');
        }
        if (!post) {
            throw new Error('Post not found or you have already liked Post post.');
        }
        const user = await User.findById(sessionUser).select('username');
        if (!user) {
            throw new Error('User not found');
        }
        const mappedLikes = await Promise.all(post?.toObject()?.likes?.map(async (user) => {
            if (user?.id !== sessionUser) {
                const relation = await User.checkUserRelations(user?.id, sessionUser);
                return { ...user, ...relation }
            } else {
                return user
            }
        }))
        return { post: { postId: post.toObject()?.id, likes: mappedLikes } };
    } catch (error) {
        throw new Error('Failed to unlike post: ' + error.message);
    }
};


const Post = mongoose.model('Post', postSchema);

export default Post;
