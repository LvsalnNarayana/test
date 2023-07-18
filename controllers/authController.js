import User from "../models/userModel.js";
import asyncHandler from 'express-async-handler';
import matchPassword from './../utilities/matchPassword.js';
import userValidationSchema from "../utilities/userValidationSchema.js";
export const Login = asyncHandler(async (req, res) => {
    try {
        const userDetails = { userData: req?.body?.userData, password: req?.body?.password }
        const user = await User.loginUser(userDetails?.userData);
        if (user) {
            if (await matchPassword(userDetails?.password, user?.password)) {
                req.session.user = { id: user?.id, username: user?.username };
                req?.session?.save();
                if (req?.session?.user?.id != null) {
                    res.status(200).json({ success: true, message: "user logged in" });
                }
            } else {
                res.status(401).json({ success: false, message: "Invalid Credentials" });
            }
        } else {
            res.status(401).json({ success: false, message: "User Not Found" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: "Something went wrong please try again!" });
    }
});

export const Logout = asyncHandler(async (req, res) => {
    try {
        req.session.destroy();
        res.status(200).json({ success: true, message: 'Logged Out' });
    } catch (error) {
        res.status(500).json({ success: false, message: "something wen wrong please try again!" })
    }
});

export const Signup = asyncHandler(async (req, res) => {
    try {
        const newUser = {
            username: 'test3',
            email: 'test@test.com',
            mobile: '9876543210',
            country: 'usa',
            gender: 'male',
            password: '111111',
            dateOfBirth: new Date("1995-04-03"),
        }
        const validatedData = await userValidationSchema.validateAsync(newUser);
        const user = await User.create(validatedData);
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ success: false, message: 'something went wrong please try again!' })
    }
});