import { faker } from '@faker-js/faker';
import mongoose from 'mongoose';
import User from './models/userModel.js';
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
        const mobile = faker.phone.number('###-###-####');
        const country = faker.location.country();
        const gender = faker.helpers.arrayElement(['Male', 'Female']);
        const password = faker.internet.password();
        const dob = faker.date.past();
        const img_url = faker.image.avatar();
        const settings = {
            notifications: faker.datatype.boolean(),
            privacy: faker.helpers.arrayElement(['public', 'private']),
        };
        users.push({ username, email, mobile, country, gender, password, dob, img_url, settings });
    }
    return users;
};

// Seeder function
const seedDatabase = async () => {
    try {
        // Clear existing data
        await User.deleteMany({});

        // Generate sample data
        const userCount = 20;
        const postCountPerUser = 3;

        const users = generateUsers(userCount);
        // Create users
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