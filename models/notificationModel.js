import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
        message: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            required: true,
            enum: [
                "request",
                "post-like",
                "post-comment",
                "post-comment-like",
                "post-comment-reply",
                "post-comment-reply-like",
            ],
        },
        typeId: {
            type: String,
            required: true,
        },
        read: {
            type: Boolean,
            default: false,
        },
        sender: {
            type: String,
        },
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
notificationSchema.options.toJSON.transform = function (doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
};

notificationSchema.options.toObject.transform = function (doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
};
// Static methods

// Create a new notification with the specified message, type, typeId, userId, and sender
notificationSchema.statics.createNotification = async function (
    notificationData
) {
    try {
        const { message, type, typeId, userId, sender } = notificationData;
        const notification = await Notification.create({
            message,
            type,
            typeId,
            userId,
            sender,
        });
        return notification;
    } catch (error) {
        throw new Error(error?.message);
    }
};

// Function to create a notification for a request event
notificationSchema.statics.createRequestNotification = async function (
    notificationData
) {
    try {
        const { message, typeId, userId, sender } = notificationData;
        const existingNotification = await Notification.findOne({
            type: "request",
            typeId,
            userId,
        });

        if (existingNotification) {
            // Merge the new message into the existing notification
            const updatedNotification = await Notification.findOneAndUpdate(
                { type: "request", typeId, userId },
                { message },
                { new: true }
            );
            return updatedNotification;
        } else {
            // Create a new notification if no existing notification is found
            const newNotification = await Notification.createNotification({
                ...notificationData,
                type: "request",
            });
            return newNotification;
        }
    } catch (error) {
        throw new Error(error.message);
    }
};

// Function to create a notification for a post-like event
notificationSchema.statics.createPostLikeNotification = async function (
    message,
    postId,
    userId,
    sender
) {
    try {
        const existingNotification = await Notification.findOne({
            type: "post-like",
            typeId: postId,
            userId,
        });
        console.log(existingNotification);
        if (existingNotification) {
            // Merge the new message into the existing notification
            const updatedNotification = await Notification.findOneAndUpdate(
                { type: "post-like", typeId: postId, userId },
                { message, sender },
                { new: true }
            );
            return updatedNotification;
        } else {
            // Create a new notification if no existing notification is found
            const newNotification = await Notification.createNotification({
                message,
                type: "post-like",
                typeId: postId,
                userId,
                sender: sender,
            });
            return newNotification;
        }
    } catch (error) {
        throw new Error(error?.message);
    }
};

// Function to create a notification for a post-comment event
notificationSchema.statics.createPostCommentNotification = async function (notificationData) {
    const { message, postId, userId, sender } = notificationData;
    try {
        const newNotification = await Notification.createNotification({
            message,
            type: "post-comment",
            typeId: postId,
            userId,
            sender
        });
        return newNotification;
    } catch (error) {
        throw new Error("Error creating post-comment notification");
    }
};

// Function to create or merge post-comment-like notifications
notificationSchema.statics.createPostCommentLikeNotification = async function (
    message,
    postId,
    userId
) {
    try {
        const existingNotification = await Notification.findOne({
            type: "post-comment-like",
            typeId: postId,
            userId,
        });

        if (existingNotification) {
            // Merge the new message into the existing notification
            const updatedNotification = await Notification.findOneAndUpdate(
                { type: "post-comment-like", typeId: postId, userId },
                { message },
                { new: true }
            );
            return updatedNotification.toObject();
        } else {
            // Create a new notification if no existing notification is found
            const newNotification = await Notification.createNotification({
                message,
                type: "post-comment-like",
                typeId: postId,
                userId,
            });
            return newNotification.toObject();
        }
    } catch (error) {
        throw new Error("Error creating or merging post-comment-like notification");
    }
};

// Function to create a notification for a post-comment-reply event
notificationSchema.statics.createPostCommentReplyNotification = async function (
    message,
    postId,
    userId
) {
    try {
        const newNotification = await Notification.createNotification({
            message,
            type: "post-comment-reply",
            typeId: postId,
            userId,
        });
        return newNotification;
    } catch (error) {
        throw new Error("Error creating post-comment-reply notification");
    }
};

// Function to create or merge post-comment-reply-like notifications
notificationSchema.statics.createPostCommentReplyLikeNotification = async function (message, postId, userId) {
    try {
        const existingNotification = await Notification.findOne({
            type: "post-comment-reply-like",
            typeId: postId,
            userId,
        });

        if (existingNotification) {
            // Merge the new message into the existing notification
            const updatedNotification = await Notification.findOneAndUpdate(
                { type: "post-comment-reply-like", typeId: postId, userId },
                { message },
                { new: true }
            );
            return updatedNotification;
        } else {
            // Create a new notification if no existing notification is found
            const newNotification = await Notification.createNotification({
                message,
                type: "post-comment-reply-like",
                typeId: postId,
                userId,
            });
            return newNotification;
        }
    } catch (error) {
        throw new Error(
            "Error creating or merging post-comment-reply-like notification"
        );
    }
};

// Retrieve all notifications for a given user
notificationSchema.statics.getNotifications = async function (userId) {
    try {
        const notifications = await Notification.find({ userId });
        return notifications;
    } catch (error) {
        throw new Error("Error getting notifications");
    }
};

// Retrieve a notification by its ID
notificationSchema.statics.getNotificationById = async function (
    notificationId
) {
    try {
        const notification = await Notification.findById(notificationId);
        return notification;
    } catch (error) {
        throw new Error("Error getting notification by ID");
    }
};

// Mark a notification as read by updating its read status to true
notificationSchema.statics.markAsRead = async function (notificationId, sessionUser) {
    try {
        const updatedNotification = await Notification.findOneAndUpdate(
            { _id: notificationId, userId: sessionUser },
            { read: true },
            { new: true }
        );
        return updatedNotification;
    } catch (error) {
        throw new Error("Error marking notification as read");
    }
};

// Mark all unread notifications as read by updating their read status to true
notificationSchema.statics.markAllAsRead = async function (userId) {
    try {
        await Notification.updateMany({ userId, read: false }, { read: true });
        const notifications = await Notification.find({ userId });
        return notifications;
    } catch (error) {
        throw new Error("Error marking all notifications as read");
    }
};

// Find all unread notifications for a given user

notificationSchema.statics.findUnreadNotifications = async function (userId) {
    try {
        const unreadNotifications = await Notification.find({
            userId,
            read: false,
        });
        return unreadNotifications;
    } catch (error) {
        throw new Error("Error finding unread notifications");
    }
};

// Delete a notification by its ID
notificationSchema.statics.deleteNotification = async function (notificationId, userId) {
    try {
        const deletedNotification = await Notification.findByIdAndDelete({
            _id: notificationId,
            userId,
        });
        return deletedNotification;
    } catch (error) {
        throw new Error("Error deleting notification");
    }
};

// Delete all notifications for a given user
notificationSchema.statics.deleteAllNotifications = async function (userId) {
    try {
        await Notification.deleteMany({ userId });
    } catch (error) {
        throw new Error("Error deleting all notifications");
    }
};

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
