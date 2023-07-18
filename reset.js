import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/userModel.js';
import Post from './models/postModel.js';
import Comment from './models/commentModel.js';
import Request from './models/requestModel.js';
import Notification from './models/notificationModel.js';
import userValidationSchema from './utilities/userValidationSchema.js';

dotenv.config();

dotenv.config(); 

// Connect to MongoDB
await mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Generate sample users
const resetDatabase = async () => {
    const newUsers = [
        {
            username: 'test1',
            email: 'test1@test.com',
            mobile: '9876543210',
            country: 'usa',
            gender: 'male',
            password: '111111',
            dateOfBirth: new Date("1995-04-03"),
        },
        {
            username: 'test2',
            email: 'test2@test.com',
            mobile: '9876543111',
            country: 'usa',
            gender: 'male',
            password: '111111',
            dateOfBirth: new Date("1995-04-03"),
        }
    ]
    try {
        const validatedData = await Promise.all(newUsers.map(async user => {
            return await userValidationSchema.validateAsync(user);
        }));
        await User.deleteMany({});
        await Notification.deleteMany({});
        await Request.deleteMany({});
        await Post.deleteMany({});
        await Comment.deleteMany({});
        const users = await User.create(validatedData);
        for (const user of users) {
            const postData = {
                user: user?.id,
                post_type: 'friends',
                description: 'lorem ipsum',
                images: ['lorem', 'ipsum']
            };
            await Post.createPost(postData);
        }
        console.log("Database Reset Successfully !");
        process.exit(0);
    } catch (error) {
        console.error('Error Resetting the database:', error);
        process.exit(1);
    }
}
resetDatabase();