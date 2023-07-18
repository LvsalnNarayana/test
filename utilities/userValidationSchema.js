import Joi from 'joi';

const userValidationSchema = Joi.object({
    username: Joi.string().required().min(3).max(30),
    email: Joi.string().required().email(),
    password: Joi.string().required().min(6),
    dateOfBirth: Joi.date().required(),
    gender: Joi.string().valid('male', 'female', 'other'),
    mobile: Joi.string().pattern(/^\d{10}$/),
    country: Joi.string(),
});

export default userValidationSchema;
