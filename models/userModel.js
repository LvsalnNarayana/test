import mongoose from "mongoose";
import Request from "./requestModel.js";
import Notification from "./notificationModel.js";
import Post from "./postModel.js";
import Event from "./eventModel.js";

// Define the User schema
const userSchema = new mongoose.Schema(
    {
        // Username field
        username: {
            type: String,
            required: [true, "Username is required."],
            unique: true,
            trim: true,
            minlength: [3, "Username must be at least 3 characters long."],
            maxlength: [30, "Username cannot exceed 30 characters."],
        },
        // Email field
        email: {
            type: String,
            required: [true, "Email is required."],
            unique: true,
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address."],
        },
        // Password field
        password: {
            type: String,
            required: [true, "Password is required."],
            minlength: [6, "Password must be at least 6 characters long."],
        },
        // Bio field
        bio: {
            type: String,
            maxlength: [160, "Bio cannot exceed 160 characters."],
        },
        // Date of Birth field
        dateOfBirth: {
            type: Date,
        },
        // Gender field
        gender: {
            type: String,
            enum: ["male", "female", "other"],
        },
        // Mobile field
        mobile: {
            type: String,
            validate: {
                validator: function (value) {
                    return /\d{10}/.test(value);
                },
                message: "Please enter a valid 10-digit mobile number.",
            },
        },
        // Country field
        country: {
            type: String,
            enum: ["USA", "Canada", "UK", "Australia", "India", "Other"],
            default: "Other",
        },
        // Lives In field
        livesIn: {
            type: String,
        },
        // From field
        from: {
            type: String,
        },
        // Education field
        education: [
            {
                school: {
                    type: String,
                },
                degree: {
                    type: String,
                },
                fieldOfStudy: {
                    type: String,
                },
                yearStarted: {
                    type: Number,
                },
                yearCompleted: {
                    type: Number,
                },
            },
        ],
        // Work field
        work: [
            {
                company: {
                    type: String,
                },
                position: {
                    type: String,
                },
                yearStarted: {
                    type: Number,
                },
                yearEnded: {
                    type: Number,
                },
            },
        ],
        // Places Checked In field
        placesCheckedIn: [
            {
                name: {
                    type: String,
                },
                location: {
                    type: String,
                },
                checkInDate: {
                    type: Date,
                },
            },
        ],
        // Settings field
        settings: {
            theme: {
                type: String,
                enum: ["light", "dark"],
                default: "light",
            },
            language: {
                type: String,
                enum: ["english", "spanish", "french"],
                default: "english",
            },
            notifications: {
                type: Boolean,
                default: true,
            },
        },
        // Events field
        events: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Event",
                default: [],
            },
        ],
        // Posts field
        posts: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Post",
                default: [],
            },
        ],
        // Friends field
        friends: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                default: [],
            },
        ],
        // Saved Posts field
        saved_posts: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Post",
                default: [],
            },
        ],
        // Notifications field
        notifications: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Notification",
                default: [],
            },
        ],
        // Requests field
        requests: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Request",
                default: [],
            },
        ],
    },
    {
        // Enable virtual fields in JSON representation
        toJSON: {
            virtuals: true,
        },
        // Enable virtual fields in object representation
        toObject: {
            virtuals: true,
        },
        // Enable automatic timestamps for createdAt and updatedAt fields
        timestamps: true,
    }
);

// Middleware to populate all fields before find, findById, findOneAndUpdate
// userSchema.pre(/^find/, function (next) {
//     this.populate("friends")
//         .populate("events")
//         .populate("notifications")
//         .populate("posts")
//         .populate("saved_posts");
//     next();
// });


// Transform Methods
userSchema.options.toJSON.transform = function (doc, ret) {
    // Remove sensitive fields from the JSON response
    delete ret._id;
    delete ret.password;
    delete ret.email;

    return ret;
};

userSchema.options.toObject.transform = function (doc, ret) {
    // Remove sensitive fields from the object representation
    delete ret._id;
    delete ret.password;
    delete ret.email;

    return ret;
};
// Query Methods

// Query method to search users by username and check relationship status with the session user
// userSchema.query.byUsername = function (username, sessionUser) {
//     const regex = new RegExp(username, "i");
//     const query = this.where({ username: regex });
//     // Check relationship status with the session user
//     if (sessionUser) {
//         query
//             .populate({
//                 path: "friends",
//                 match: { _id: sessionUser._id },
//             })
//             .populate({
//                 path: "requests",
//                 match: {
//                     $or: [{ sender: sessionUser._id }, { receiver: sessionUser._id }],
//                 },
//             });
//     }

//     return query;
// };

// userSchema.query.byEmail = function (email) {
//     return this.where({ email });
// };
//Static Methods

//====================================================
// User Find Methods With Relation
//====================================================
// Static method to find a user by email and check relationship status with the session user
userSchema.statics.findByEmail = async function (email, sessionUser) {
    const query = this.findOne({ email });

    // Check relationship status with the session user
    if (sessionUser) {
        query
            .populate({
                path: "friends",
                match: { _id: sessionUser._id },
            })
            .populate({
                path: "requests",
                match: {
                    $or: [{ sender: sessionUser._id }, { receiver: sessionUser._id }],
                },
            });
    }

    // Add the count of mutual friends
    if (sessionUser) {
        const user = await query.exec();
        if (user && !user._id.equals(sessionUser._id)) {
            const mutualFriends = user.friends.filter((friend) =>
                friend.friends.includes(sessionUser._id)
            );
            const mutualFriendsCount = mutualFriends.length;
            user.mutualFriendsCount = mutualFriendsCount;
            user.mutualFriends = mutualFriends.map((friend) => ({
                _id: friend._id,
                username: friend.username,
            }));
        }
        user.loggedIn = user && user._id.equals(sessionUser._id);
        const relations = await this.checkUserRelations(user._id, sessionUser._id);
        user.relations = relations;
        return user;
    }
    return query;
};

// Static method to find a user by username and check relationship with the session user
userSchema.statics.findByUsername = function (username, sessionUser) {
    const query = User.findOne({ username: username });
    console.log("hello");
    // Check relationship status with the session user
    // if (sessionUser) {
    //     query
    //         .populate({
    //             path: "friends",
    //             match: { _id: sessionUser._id },
    //         })
    //         .populate({
    //             path: "requests",
    //             match: {
    //                 $or: [{ sender: sessionUser._id }, { receiver: sessionUser._id }],
    //             },
    //         });
    // }
    // // Add the count of mutual friends
    // if (sessionUser) {
    //     const user = await query.exec();
    //     if (user && !user._id.equals(sessionUser._id)) {
    //         const mutualFriends = user.friends.filter((friend) =>
    //             friend.friends.includes(sessionUser._id)
    //         );
    //         const mutualFriendsCount = mutualFriends.length;
    //         user.mutualFriendsCount = mutualFriendsCount;
    //         user.mutualFriends = mutualFriends.map((friend) => ({
    //             _id: friend._id,
    //             username: friend.username,
    //         }));
    //     }
    //     user.loggedIn = user && user._id.equals(sessionUser._id);

    //     const relations = await this.checkUserRelations(user._id, sessionUser._id);
    //     user.relations = relations;

    //     return user;
    // }

    return query;
};

// Static method to search users and check relationship status with the session user
userSchema.statics.search = async function (query, sessionUser) {
    const searchQuery = this.find({ $text: { $search: query } }).sort({
        score: { $meta: "textScore" },
    });

    // Check relationship status with the session user
    if (sessionUser) {
        searchQuery
            .populate({
                path: "friends",
                match: { _id: sessionUser._id },
            })
            .populate({
                path: "requests",
                match: {
                    $or: [{ sender: sessionUser._id }, { receiver: sessionUser._id }],
                },
            });
    }

    // Add the count of mutual friends to each user
    if (sessionUser) {
        const users = await searchQuery.exec();
        for (const user of users) {
            if (!user._id.equals(sessionUser._id)) {
                const mutualFriends = user.friends.filter((friend) =>
                    friend.friends.includes(sessionUser._id)
                );
                const mutualFriendsCount = mutualFriends.length;
                user.mutualFriendsCount = mutualFriendsCount;
                user.mutualFriends = mutualFriends.map((friend) => ({
                    _id: friend._id,
                    username: friend.username,
                }));
            }
            user.loggedIn = user && user._id.equals(sessionUser._id);

            const relations = await this.checkUserRelations(
                user._id,
                sessionUser._id
            );
            user.relations = relations;
        }
        return users;
    }

    return searchQuery;
};

// Static method to check complex relationships between two users
userSchema.statics.checkUserRelations = async function (user1Id, user2Id) {
    try {
        const user1 = await this.findById(user1Id);
        const user2 = await this.findById(user2Id);

        if (!user1 || !user2) {
            throw new Error("User not found.");
        }

        const isFriend = user1.friends.includes(user2Id);
        const isRequestedByUser1 = await Request.exists({
            sender: user2Id,
            receiver: user1Id,
        });
        const isRequestedByUser2 = await Request.exists({
            sender: user1Id,
            receiver: user2Id,
        });

        const response = {
            user1Id: user1._id,
            user2Id: user2._id,
            user1Username: user1.username,
            user2Username: user2.username,
            isFriend,
            isRequestedByUser1,
            isRequestedByUser2,
        };

        // Add mutual friends if users are not the same
        if (!user1._id.equals(user2._id)) {
            const mutualFriendsUser1 = user1.friends.filter((friend) =>
                friend.friends.includes(user2._id)
            );
            const mutualFriendsUser2 = user2.friends.filter((friend) =>
                friend.friends.includes(user1._id)
            );
            response.mutualFriendsUser1 = mutualFriendsUser1.map((friend) => ({
                _id: friend._id,
                username: friend.username,
            }));
            response.mutualFriendsUser2 = mutualFriendsUser2.map((friend) => ({
                _id: friend._id,
                username: friend.username,
            }));
        }

        return response;
    } catch (error) {
        throw new Error("Failed to check user relationships: " + error.message);
    }
};

//====================================================
// Friend Methods
//====================================================

// Static method to add a friend to a user's friends list
userSchema.statics.addFriend = async function (userId, friendId) {
    try {
        const user = await this.findById(userId);

        if (!user) {
            throw new Error("User not found.");
        }

        if (user.friends.includes(friendId)) {
            throw new Error("Friend already exists in the user's friends list.");
        }

        user.friends.push(friendId);
        await user.save();

        return user;
    } catch (error) {
        throw new Error("Failed to add friend to user: " + error.message);
    }
};

// Static method to get all friends of a user
userSchema.statics.getAllFriends = async function (userId) {
    try {
        const user = await this.findById(userId).populate("friends");
        if (!user) {
            throw new Error("User not found.");
        }
        return user.friends;
    } catch (error) {
        throw new Error("Failed to get user friends: " + error.message);
    }
};

// Static method to get all friend requests of a user
userSchema.statics.getAllFriendRequests = async function (userId) {
    try {
        const user = await this.findById(userId).populate("requests");
        if (!user) {
            throw new Error("User not found.");
        }
        return user.requests;
    } catch (error) {
        throw new Error("Failed to get user friend requests: " + error.message);
    }
};

// Static method to get a friend by ID
userSchema.statics.getFriendById = async function (userId, friendId) {
    try {
        const user = await this.findById(userId).populate({
            path: "friends",
            match: { _id: friendId },
        });
        if (!user) {
            throw new Error("User not found.");
        }
        const friend = user.friends.find((friend) => friend._id.equals(friendId));
        if (!friend) {
            throw new Error("Friend not found.");
        }
        return friend;
    } catch (error) {
        throw new Error("Failed to get friend by ID: " + error.message);
    }
};

// Static method to get a friend request by ID
userSchema.statics.getFriendRequestById = async function (
    userId,
    friendRequestId
) {
    try {
        const user = await this.findById(userId).populate({
            path: "requests",
            match: { _id: friendRequestId },
        });
        if (!user) {
            throw new Error("User not found.");
        }
        const friendRequest = user.requests.find((friendRequest) =>
            friendRequest._id.equals(friendRequestId)
        );
        if (!friendRequest) {
            throw new Error("Friend request not found.");
        }
        return friendRequest;
    } catch (error) {
        throw new Error("Failed to get friend request by ID: " + error.message);
    }
};

// Static method to accept a friend request
userSchema.statics.acceptFriendRequest = async function (userId, friendId) {
    try {
        // Update user1's friends and remove the friendId from requests
        await this.findByIdAndUpdate(userId, { $push: { friends: friendId } });
        await Request.findOneAndDelete({ sender: friendId, receiver: userId });
        // Update user2's friends and remove the userId from sentRequests
        await this.findByIdAndUpdate(friendId, { $push: { friends: userId } });
        await Request.findOneAndDelete({ sender: userId, receiver: friendId });
        return true; // Return true to indicate successful acceptance
    } catch (error) {
        throw new Error("Failed to accept friend request: " + error.message);
    }
};

// Static method to reject a friend request
userSchema.statics.rejectFriendRequest = async function (userId, friendId) {
    try {
        // Remove the friendId from requests
        await Request.findOneAndDelete({ sender: friendId, receiver: userId });
        // Remove the userId from sentRequests
        await Request.findOneAndDelete({ sender: userId, receiver: friendId });
        return true; // Return true to indicate successful rejection
    } catch (error) {
        throw new Error("Failed to reject friend request: " + error.message);
    }
};

// Static method to send a friend request
userSchema.statics.sendFriendRequest = async function (senderId, receiverId) {
    try {
        const sender = await this.findById(senderId);
        const receiver = await this.findById(receiverId);
        if (!sender || !receiver) {
            throw new Error("User not found.");
        }
        // Check if a friend request already exists
        const existingRequest = await Request.findOne({
            sender: senderId,
            receiver: receiverId,
        });
        if (existingRequest) {
            throw new Error("Friend request already sent.");
        }
        // Create a new friend request
        const newRequest = new Request({ sender: senderId, receiver: receiverId });
        await newRequest.save();
        return true; // Return true to indicate successful request sending
    } catch (error) {
        throw new Error("Failed to send friend request: " + error.message);
    }
};

// Static method to cancel a friend request
userSchema.statics.cancelFriendRequest = async function (senderId, receiverId) {
    try {
        // Remove the friend request document
        await Request.findOneAndDelete({ sender: senderId, receiver: receiverId });
        return true; // Return true to indicate successful cancellation
    } catch (error) {
        throw new Error("Failed to cancel friend request: " + error.message);
    }
};

// Static method to get a user's friend suggestions with the number of mutual friends
userSchema.statics.getFriendSuggestions = async function (userId) {
    try {
        const user = await this.findById(userId);
        if (!user) {
            throw new Error("User not found.");
        }
        // Retrieve the friends of user's friends
        const friendsOfFriends = await this.find({
            _id: { $nin: user.friends },
        }).populate("friends", "username");
        // Find friend suggestions based on mutual friends
        const friendSuggestions = friendsOfFriends.map((friend) => {
            const mutualFriends = friend.friends.filter((friendOfFriend) =>
                user.friends.includes(friendOfFriend._id)
            );
            return {
                _id: friend._id,
                username: friend.username,
                mutualFriendsCount: mutualFriends.length,
            };
        });
        return friendSuggestions;
    } catch (error) {
        throw new Error("Failed to get friend suggestions: " + error.message);
    }
};

// Static method to get common friends between two users
userSchema.statics.getCommonFriends = async function (user1Id, user2Id) {
    try {
        const user1 = await this.findById(user1Id).populate("friends", "username");
        const user2 = await this.findById(user2Id).populate("friends", "username");

        if (!user1 || !user2) {
            throw new Error("User not found.");
        }

        const commonFriends = user1.friends.filter((friend1) =>
            user2.friends.some((friend2) => friend2._id.equals(friend1._id))
        );

        return commonFriends;
    } catch (error) {
        throw new Error("Failed to get common friends: " + error.message);
    }
};

// Static method to count the number of friends for a user
userSchema.statics.countFriends = async function (userId) {
    try {
        const user = await this.findById(userId);
        if (!user) {
            throw new Error("User not found.");
        }
        const friendCount = user.friends.length;
        return friendCount;
    } catch (error) {
        throw new Error("Failed to count friends: " + error.message);
    }
};

//====================================================
// Event Methods
//====================================================

// Static method to add an event to a user's events list
userSchema.statics.addEvent = async function (userId, eventId) {
    try {
        const user = await this.findById(userId);

        if (!user) {
            throw new Error("User not found.");
        }

        if (user.events.includes(eventId)) {
            throw new Error("Event already exists in the user's events list.");
        }

        user.events.push(eventId);
        await user.save();

        return user;
    } catch (error) {
        throw new Error("Failed to add event to user: " + error.message);
    }
};

// Static method to get all events of a user
userSchema.statics.getAllEvents = async function (userId) {
    try {
        const user = await this.findById(userId).populate("events");
        if (!user) {
            throw new Error("User not found.");
        }
        return user.events;
    } catch (error) {
        throw new Error("Failed to get user events: " + error.message);
    }
};
// Static method to get an event by ID
userSchema.statics.getEventById = async function (userId, eventId) {
    try {
        const user = await this.findById(userId).populate({
            path: "events",
            match: { _id: eventId },
        });
        if (!user) {
            throw new Error("User not found.");
        }
        const event = user.events.find((event) => event._id.equals(eventId));
        if (!event) {
            throw new Error("Event not found.");
        }
        return event;
    } catch (error) {
        throw new Error("Failed to get event by ID: " + error.message);
    }
};

//====================================================
// Notification Methods
//====================================================

// Static method to add a notification to a user's notifications list
userSchema.statics.addNotification = async function (userId, notificationId) {
    try {
        const user = await this.findById(userId);

        if (!user) {
            throw new Error("User not found.");
        }

        if (user.notifications.includes(notificationId)) {
            throw new Error(
                "Notification already exists in the user's notifications list."
            );
        }

        user.notifications.push(notificationId);
        await user.save();

        return user;
    } catch (error) {
        throw new Error("Failed to add notification to user: " + error.message);
    }
};

// Static method to get all notifications of a user
userSchema.statics.getAllNotifications = async function (userId) {
    try {
        const user = await this.findById(userId).populate("notifications");
        if (!user) {
            throw new Error("User not found.");
        }
        return user.notifications;
    } catch (error) {
        throw new Error("Failed to get user notifications: " + error.message);
    }
};

// Static method to get a notification by ID
userSchema.statics.getNotificationById = async function (
    userId,
    notificationId
) {
    try {
        const user = await this.findById(userId).populate({
            path: "notifications",
            match: { _id: notificationId },
        });
        if (!user) {
            throw new Error("User not found.");
        }
        const notification = user.notifications.find((notification) =>
            notification._id.equals(notificationId)
        );
        if (!notification) {
            throw new Error("Notification not found.");
        }
        return notification;
    } catch (error) {
        throw new Error("Failed to get notification by ID: " + error.message);
    }
};

//====================================================
// Post Methods
//====================================================

// Static method to add a post to a user's posts list
userSchema.statics.addPost = async function (userId, postId) {
    try {
        const user = await this.findById(userId);

        if (!user) {
            throw new Error("User not found.");
        }

        if (user.posts.includes(postId)) {
            throw new Error("Post already exists in the user's posts list.");
        }

        user.posts.push(postId);
        await user.save();

        return user;
    } catch (error) {
        throw new Error("Failed to add post to user: " + error.message);
    }
};

// Static method to add a post to a user's saved_posts list
userSchema.statics.addSavedPost = async function (userId, postId) {
    try {
        const user = await this.findById(userId);

        if (!user) {
            throw new Error("User not found.");
        }

        if (user.saved_posts.includes(postId)) {
            throw new Error("Post already exists in the user's saved posts list.");
        }

        user.saved_posts.push(postId);
        await user.save();

        return user;
    } catch (error) {
        throw new Error("Failed to add saved post to user: " + error.message);
    }
};

// Static method to get all posts of a user
userSchema.statics.getAllPosts = async function (userId) {
    try {
        const user = await this.findById(userId).populate("posts");
        if (!user) {
            throw new Error("User not found.");
        }
        return user.posts;
    } catch (error) {
        throw new Error("Failed to get user posts: " + error.message);
    }
};

// Static method to get all saved posts of a user
userSchema.statics.getAllSavedPosts = async function (userId) {
    try {
        const user = await this.findById(userId).populate("saved_posts");
        if (!user) {
            throw new Error("User not found.");
        }
        return user.saved_posts;
    } catch (error) {
        throw new Error("Failed to get user saved posts: " + error.message);
    }
};

// Static method to get a post by ID
userSchema.statics.getPostById = async function (userId, postId) {
    try {
        const user = await this.findById(userId).populate({
            path: "posts",
            match: { _id: postId },
        });
        if (!user) {
            throw new Error("User not found.");
        }
        const post = user.posts.find((post) => post._id.equals(postId));
        if (!post) {
            throw new Error("Post not found.");
        }
        return post;
    } catch (error) {
        throw new Error("Failed to get post by ID: " + error.message);
    }
};

// Static method to get a saved post by ID
userSchema.statics.getSavedPostById = async function (userId, savedPostId) {
    try {
        const user = await this.findById(userId).populate({
            path: "saved_posts",
            match: { _id: savedPostId },
        });
        if (!user) {
            throw new Error("User not found.");
        }
        const savedPost = user.saved_posts.find((savedPost) =>
            savedPost._id.equals(savedPostId)
        );
        if (!savedPost) {
            throw new Error("Saved post not found.");
        }
        return savedPost;
    } catch (error) {
        throw new Error("Failed to get saved post by ID: " + error.message);
    }
};

//====================================================
// Miscellaneous Methods
//====================================================
// Static method to search users by username and check relationship status with the session user
userSchema.statics.searchUsers = async function (searchTerm, sessionUser) {
    try {
        const users = await this.find({
            username: { $regex: searchTerm, $options: "i" },
        });
        // Check relationship status with the session user
        const usersWithRelations = await Promise.all(
            users.map(async (user) => {
                const relation = await this.checkUserRelations(
                    sessionUser._id,
                    user._id
                );
                return {
                    ...user.toObject(),
                    relation,
                };
            })
        );
        return usersWithRelations;
    } catch (error) {
        throw new Error("Failed to search users: " + error.message);
    }
};

// Static method to get the latest posts from friends
userSchema.statics.getLatestFriendPosts = async function (userId, limit) {
    try {
        const user = await this.findById(userId);
        if (!user) {
            throw new Error("User not found.");
        }
        const friendPosts = await Post.find({ author: { $in: user.friends } })
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate("author", "username");
        return friendPosts;
    } catch (error) {
        throw new Error("Failed to get latest friend posts: " + error.message);
    }
};

// Static method to delete a user and their associated data
userSchema.statics.deleteUser = async function (userId) {
    try {
        const user = await this.findById(userId);
        if (!user) {
            throw new Error("User not found.");
        }
        // Delete user's posts, notifications, events, etc. (based on your schema)
        await Post.deleteMany({ author: userId });
        await Notification.deleteMany({ user: userId });
        await Event.deleteMany({ participants: userId });

        // Delete user from friends' lists
        await this.updateMany({ friends: userId }, { $pull: { friends: userId } });

        // Delete user
        await this.findByIdAndDelete(userId);

        return true; // Return true to indicate successful deletion
    } catch (error) {
        throw new Error("Failed to delete user: " + error.message);
    }
};

// Static method to update a user's settings
userSchema.statics.updateSettings = async function (userId, settings) {
    try {
        const user = await this.findByIdAndUpdate(
            userId,
            { settings },
            { new: true }
        );
        return user;
    } catch (error) {
        throw new Error("Failed to update user settings: " + error.message);
    }
};

// Create the User model
const User = mongoose.model("User", userSchema);

export default User;
