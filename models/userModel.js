import mongoose from "mongoose";
import Request from "./requestModel.js";
import Notification from "./notificationModel.js";
import Post from "./postModel.js";
import Event from "./eventModel.js";
import bcryptjs from "bcryptjs";
import moment from "moment";

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
      required: true,
    },
    // Gender field
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    // Mobile fields
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
          get: function (value) {
            return moment(value).format("DD-MMMM-YYYY");
          },
          set: function (value) {
            return moment(value, "DD-MMMM-YYYY").toDate();
          },
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
userSchema.index(
  { username: "text" },
  { textSearchOptions: { minWordLength: 1 } }
);

//=============================================
//_____________  encrypt password  ___________
//=============================================
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcryptjs.genSalt(10);
  this.password = await bcryptjs.hash(this.password, salt);
  next();
});

// Transform Methods
userSchema.options.toJSON.transform = function (doc, ret, options) {
  delete ret._id;
  delete ret.__v;
  delete ret.password;
  delete ret.email;
  delete ret.updatedAt;
  if (options.includePassword === true) {
    ret.password = doc.password;
  }
  return ret;
};

userSchema.options.toObject.transform = function (doc, ret, options) {
  delete ret._id;
  delete ret.__v;
  delete ret.password;
  delete ret.updatedAt;
  delete ret.email;
  if (options.includePassword === true) {
    ret.password = doc.password;
  }
  return ret;
};

//Static Methods

//====================================================
// User Find Methods With Relation
//====================================================
userSchema.statics.loginUser = async function (userData) {
  try {
    const user = await User.findOne({
      $or: [{ username: userData }, { email: userData }],
    })
      .select("username password")
      .exec();
    if (user) {
      return user.toObject({ includePassword: true });
    } else {
      throw new Error("User not Found");
    }
  } catch (error) {
    throw new Error(error.message);
  }
};
userSchema.statics.findByUsername = async function (userData, sessionUser) {
  try {
    const query = await User.findOne({
      $or: [{ username: userData }, { email: userData }],
    })
      .populate("friends", "username")
      .populate({
        path: "posts",
        match: {
          $or: [{ post_type: "friends" }, { post_type: "public" }],
        },
        options: {
          sort: { createdAt: -1 },
        },
      })
      .exec();
    if (!query) {
      throw new Error("user not found")
    }
    const user = query.toObject();
    const friendsWithRelations = await Promise.all(
      user?.friends?.map(async (friend) => {
        const friendId = friend.id;
        if (friendId !== sessionUser) {
          const relation = await User.checkUserRelations(friendId, sessionUser);
          return { ...friend, ...relation };
        } else {
          return { ...friend }
        }
      })
    );
    // Loop through the posts
    user.posts = user.posts.map((post) => {
      const isPostLikedByUser = post.likes.some(
        (like) => like.toString() === sessionUser
      );
      const transformedComments = post.comments.map((comment) => {
        const isCommentAuthor = comment.user.id === sessionUser;
        const isCommentLikedByUser = comment.likes.some(
          (like) => like.toString() === sessionUser
        );
        const transformedReplies = comment.replies.map((reply) => {
          const isReplyAuthor = reply.user.id === sessionUser;
          const isReplyLikedByUser = reply.likes.some(
            (like) => like.toString() === sessionUser
          );
          return {
            ...reply,
            likedByUser: isReplyLikedByUser,
            author: isReplyAuthor,
          };
        });
        return {
          ...comment,
          likedByUser: isCommentLikedByUser,
          author: isCommentAuthor,
          replies: transformedReplies,
        };
      });
      return {
        ...post,
        likedByUser: isPostLikedByUser,
        owner: post.user.id === sessionUser,
        comments: transformedComments,
      };
    });
    if (user?.id !== sessionUser) {
      const relation = await User.checkUserRelations(user?.id, sessionUser);
      return { ...user, friends: friendsWithRelations, ...relation, loggedIn: false };
    } else {
      return { ...user, friends: friendsWithRelations, loggedIn: true };
    }
  } catch (error) {
    throw new Error(error?.message);
  }
};
userSchema.statics.search = async function (query, sessionUser) {
  const searchQuery = await User.find({
    $text: { $search: query, $caseSensitive: false },
  })
    .select("username")
    .sort({ score: { $meta: "textScore" } });
  const mappedResults = await Promise.all(
    searchQuery.map(async (queryData) => {
      if (queryData?.id !== sessionUser) {
        const relation = await User.checkUserRelations(
          queryData?.id,
          sessionUser
        );
        return { ...queryData.toObject(), ...relation };
      } else {
        return queryData.toObject();
      }
    })
  );

  return mappedResults;
};
userSchema.statics.checkUserRelations = async function (user1Id, sessionUser) {
  try {
    const user1 = await User.findById(user1Id)
      .populate("friends", "username friends")
      .select("username friends")
      .exec();
    const sessionuser = await User.findById(sessionUser)
      .populate("friends", "username friends")
      .select("username friends")
      .exec();
    if (!user1 || !sessionuser) {
      throw new Error("User not found.");
    }
    const isFriend = user1?.friends?.some(
      (friend) => friend.id === sessionUser
    );
    const mutualFriends = user1.friends
      .filter((friend) => friend?.friends?.includes(sessionUser))
      .map((friend) => {
        return {
          id: friend?.id,
          username: friend?.username,
        };
      });
    const sent = await Request.exists({
      sender: sessionUser,
      receiver: user1Id,
      status: 'pending'
    });
    const received = await Request.exists({
      sender: user1Id,
      receiver: sessionUser,
      status: 'pending'
    });
    const relation = {
      friend: isFriend,
      mutual_friends: mutualFriends,
      request_status: sent ? "sent" : received ? "received" : "none",
    };
    return relation;
  } catch (error) {
    throw new Error(error.message);
  }
};

//====================================================
// User Methods
//====================================================
userSchema.statics.getAllFriends = async function (username, sessionUser) {
  try {
    const user = await User.findOne({ username })
      .populate("friends", "username")
      .select("friends")
      .exec();
    if (!user) {
      throw new Error("User not found.");
    }
    const updatedFriends = await Promise.all(
      user.toObject()?.friends.map(async (friend) => {
        const relation = await User.checkUserRelations(friend?.id, sessionUser);
        return { ...friend, ...relation };
      })
    );
    return { id: user?.toObject()?.id, friends: updatedFriends };
  } catch (error) {
    throw new Error("Failed to get user friends: " + error.message);
  }
};
userSchema.statics.getAbout = async function (username, sessionUser) {
  try {
    const user = await User.findOne({ username })
      .select("-friends -events -settings -posts -notifications -saved_posts -placesCheckedIn -requests")
      .exec();
    if (!user) {
      throw new Error("User not found.");
    }
    return user;
  } catch (error) {
    throw new Error("Failed to get user friends: " + error.message);
  }
};
userSchema.statics.getPosts = async function (username,sessionUser) {
  try {
    const user = await User.findById(sessionUser)
      .populate("friends", "username")
      .select("friends")
      .exec();
    const updatedFriends = await Promise.all(
      user.toObject()?.friends.map(async (friend) => {
        const relation = await User.checkUserRelations(friend?.id, sessionUser);
        return { ...friend, ...relation };
      })
    );
    if (!user) {
      throw new Error("User not found.");
    }
    return { id: user?.toObject()?.id, friends: updatedFriends };
  } catch (error) {
    throw new Error("Failed to get user friends: " + error.message);
  }
};
//====================================================
// Request Action Methods
//====================================================
userSchema.statics.getAllFriendRequests = async function (sessionUser) {
  try {
    const user = await User.findById(sessionUser);
    if (!user) {
      throw new Error("User not found.");
    }
    const requests = await Request.find({
      receiver: sessionUser,
      status: "pending",
    })
      .populate("sender", "username")
      .select("sender receiver")
      .exec();
    const newRequests = await Promise.all(
      requests.map(async (request) => {
        const relation = await User.checkUserRelations(
          request?.sender?.id,
          sessionUser
        );
        return {
          id: request.toObject()?.id,
          sender: { ...request.sender.toObject(), ...relation },
        };
      })
    );
    return newRequests;
  } catch (error) {
    throw new Error("Failed to get user friend requests: " + error.message);
  }
};
userSchema.statics.sendRequest = async function (requestData) {
  try {
    const sender = await User.findById(requestData.senderId).select(
      "username friends"
    );
    const receiver = await User.findById(requestData.receiverId).select(
      "username friends"
    );
    if (!sender || !receiver) {
      throw new Error("User not found.");
    }
    if (sender.friends.includes(requestData.receiverId)) {
      throw new Error("Friend already exists in the user's friends list.");
    }
    const existingRequest = await Request.findOne({
      sender: requestData.senderId,
      receiver: requestData.receiverId
    });
    const existingNotification = await Notification.findOne({ userId: receiver?.id, typeId: existingRequest?.id, sender: sender?.username })
    const notificationData = {
      message: sender?.toObject()?.username + " has sent you friend request",
      userId: receiver?.id,
      sender: sender?.username,
    };
    if (existingRequest) {
      if (existingRequest && existingRequest?.status === 'pending') {
        return { request: existingRequest, notification: existingNotification }
      }
      if (existingRequest && existingRequest?.status === "rejected") {
        const updatedRequest = await Request.findOneAndUpdate(
          { sender: requestData.senderId, receiver: requestData.receiverId, status: 'rejected' },
          { status: "pending" },
          { new: true }
        );
        const updatedNotification = await Notification.createRequestNotification({
          ...notificationData,
          typeId: updatedRequest?.id,
        });
        return { request: updatedRequest, notification: updatedNotification };
      }
    } else {
      const newRequest = await Request.createRequest(requestData);
      const newNotification = await Notification.createRequestNotification({
        ...notificationData,
        typeId: newRequest?.id,
      });
      return { request: newRequest, notification: newNotification };
    }

  } catch (error) {
    throw new Error(error.message);
  }
};
userSchema.statics.acceptRequest = async function (requestData) {
  const { senderId, sessionUser } = requestData;
  try {
    if (senderId !== sessionUser) {
      const sender = await User.findById(senderId).select("username");
      const receiver = await User.findById(sessionUser).select("username");
      const request = await Request.findOneAndUpdate(
        { sender: senderId, receiver: sessionUser, status: 'pending' },
        { status: "accepted" },
        { new: true }
      );
      if (!sender) {
        throw new Error("Sender User Not Found");
      }
      if (!receiver) {
        throw new Error("Receiver User Not Found");
      }
      if (!request) {
        throw new Error("Request Not Found");
      }
      if (sender && receiver && request) {
        const notificationData = {
          message: receiver?.toObject()?.username + " has aceepted your friend request",
          typeId: request?.id,
          userId: sender?.id,
          sender: receiver?.username,
        };
        const notification = await Notification.createRequestNotification(notificationData);
        const senderResult = await User.findByIdAndUpdate(senderId, {
          $addToSet: { friends: sessionUser },
        });
        const userResult = await User.findByIdAndUpdate(sessionUser, {
          $addToSet: { friends: senderId },
        });
        if (!senderResult || !userResult) {
          throw new Error("Error Aceepting Request");
        }
        return { request: request, notification: notification }
      } else {
        throw new Error("Error Aceepting Request");
      }
    } else {
      throw new Error("sessionUser and UserId are same");
    }
  } catch (error) {
    throw new Error(error.message);
  }
};
userSchema.statics.rejectRequest = async function (requestData) {
  const { senderId, sessionUser } = requestData;
  try {
    const rejected_request = await Request.findOneAndUpdate(
      { sender: senderId, receiver: sessionUser, status: 'pending' },
      { status: "rejected" },
      { new: true }
    );
    return rejected_request;
  } catch (error) {
    throw new Error("Failed to reject friend request: " + error.message);
  }
};
userSchema.statics.cancelRequest = async function (requestData) {
  const { receiverId, sessionUser } = requestData;
  try {
    const request = await Request.findOne({ sender: sessionUser, receiver: receiverId, status: 'pending' });
    await Notification.findOneAndDelete({
      typeId: request?.id,
      userId: receiverId,
      type: "request",
    });
    await Request.findOneAndDelete({ sender: sessionUser, receiver: receiverId, status: 'pending' });
    return true;
  } catch (error) {
    throw new Error("Failed to cancel friend request: " + error.message);
  }
};
userSchema.statics.unfriend = async function (friendId, sessionUser) {
  try {
    const friend = await User.exists({ _id: friendId });
    const sessionuser = await User.exists({ _id: sessionUser });

    if (!friend || !sessionuser) {
      throw new Error("User Not Found")
    }

    const pullFriend = await User.findByIdAndUpdate(friendId, {
      $pull: { friends: sessionUser },
    }, { new: true }).select('friends').populate('friends', 'username').exec();

    const pullSessionUser = await User.findByIdAndUpdate(sessionUser, {
      $pull: { friends: friendId },
    }, { new: true }).select('friends').populate('friends', 'username').exec();

    await Request.findOneAndDelete({ sender: friendId, receiver: sessionUser, status: 'accepted' });
    await Request.findOneAndDelete({ sender: sessionUser, receiver: friendId, status: 'accepted' });

    if (!pullFriend || !pullSessionUser) {
      throw new Error("Error Removing Friend")
    }
    const updatedFriend = await Promise.all(pullFriend?.toObject()?.friends.map(async (friend) => {
      const relation = await User.checkUserRelations(friend?.id, pullFriend?.toObject()?.id);
      return { ...friend, ...relation };
    }));

    const updatedSessionUser = await Promise.all(pullSessionUser?.toObject()?.friends.map(async (friend) => {
      const relation = await User.checkUserRelations(friend?.id, sessionUser);
      return { ...friend, ...relation };
    }));
    console.log({ friend: { ...pullFriend.toObject(), friends: updatedFriend }, sessionUser: { ...pullSessionUser.toObject(), friends: updatedSessionUser } });
    return { friend: { ...pullFriend.toObject(), friends: updatedFriend }, sessionUser: { ...pullSessionUser.toObject(), friends: updatedSessionUser } };
  } catch (error) {
    throw new Error(error?.message)
  }
}



userSchema.statics.getFriendSuggestions = async function (userId) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found.");
    }
    // Retrieve the friends of user's friends
    const friendsOfFriends = await User.find({
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
userSchema.statics.countFriends = async function (userId) {
  try {
    const user = await User.findById(userId);
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

userSchema.statics.addEvent = async function (userId, eventId) {
  try {
    const user = await User.findById(userId);

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
userSchema.statics.getAllEvents = async function (userId) {
  try {
    const user = await User.findById(userId).populate("events");
    if (!user) {
      throw new Error("User not found.");
    }
    return user.events;
  } catch (error) {
    throw new Error("Failed to get user events: " + error.message);
  }
};
userSchema.statics.getEventById = async function (userId, eventId) {
  try {
    const user = await User.findById(userId).populate({
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

// Static method to get all notifications of a user
userSchema.statics.getAllNotifications = async function (sessionUser) {
  try {
    const notifications = await Notification.getNotifications(sessionUser);
    if (!notifications) {
      throw new Error("Notifications not found.");
    }
    return notifications;
  } catch (error) {
    throw new Error("Failed to get user notifications: " + error.message);
  }
};
userSchema.statics.markAllAsRead = async function (sessionUser) {
  try {
    const notifications = await Notification.markAllAsRead(sessionUser);
    return notifications;
  } catch (error) {
    throw new Error(error?.message);
  }
};
userSchema.statics.markAsRead = async function (notificationId, userId) {
  try {
    const notification = await Notification.markAsRead(notificationId, userId);
    return notification;
  } catch (error) {
    throw new Error(error?.message);
  }
};
userSchema.statics.findUnreadNotifications = async function (userId) {
  try {
    const notification = await Notification.findUnreadNotifications(userId);
    return notification;
  } catch (error) {
    throw new Error(error?.message);
  }
};
userSchema.statics.deleteNotification = async function (
  notificationId,
  userId
) {
  try {
    const notification = await Notification.deleteNotification(
      notificationId,
      userId
    );
    return notification;
  } catch (error) {
    throw new Error(error?.message);
  }
};
userSchema.statics.deleteAllNotifications = async function (userId) {
  try {
    await Notification.deleteAllNotifications(userId);
    return { success: true };
  } catch (error) {
    throw new Error(error?.message);
  }
}; userSchema.statics.getNotificationById = async function (
  userId,
  notificationId
) {
  try {
    const user = await User.findById(userId).populate({
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

//====================================================
// Miscellaneous Methods
//====================================================

// Static method to delete a user and their associated data
userSchema.statics.deleteUser = async function (userId) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found.");
    }
    // Delete user's posts, notifications, events, etc. (based on your schema)
    await Post.deleteMany({ author: userId });
    await Notification.deleteMany({ user: userId });
    await Event.deleteMany({ participants: userId });

    // Delete user from friends' lists
    await User.updateMany({ friends: userId }, { $pull: { friends: userId } });

    // Delete user
    await User.findByIdAndDelete(userId);

    return true; // Return true to indicate successful deletion
  } catch (error) {
    throw new Error("Failed to delete user: " + error.message);
  }
};

// Static method to update a user's settings
userSchema.statics.updateSettings = async function (userId, settings) {
  try {
    const user = await User.findByIdAndUpdate(
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
