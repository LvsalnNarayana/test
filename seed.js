import { faker } from '@faker-js/faker';
import mongoose from 'mongoose';
import User from './models/userModel.js';
import Post from './models/postModel.js';
import dotenv from 'dotenv';

dotenv.config();

dotenv.config();

// Connect to MongoDB
await mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Generate sample users
const generateUsers = (count) => {
    const users = [];
    for (let i = 0; i < count; i++) {
        const username = faker.internet.userName();
        const email = faker.internet.email();
        const bio = faker.lorem.sentence();
        const mobile = '9876543210';
        const country = 'USA';
        const gender = faker.helpers.arrayElement(['male', 'female']);
        const password = '111111';
        const dob = faker.date.past();
        const livesIn = faker.location.country();
        const from = faker.location.country();
        users.push({ username, email, mobile, country, gender, password, dob, bio, livesIn, from });
    }
    return users;
};

// Seeder function
const seedDatabase = async () => {
    try {
        // Clear existing data
        await User.deleteMany({});
        const userCount = 3;
        const users = generateUsers(userCount);
        await User.create(users);
        console.log('Sample data created successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding the database:', error);
        process.exit(1);
    }
};

// Run the seeder
seedDatabase();