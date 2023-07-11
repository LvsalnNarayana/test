import bcryptjs from 'bcryptjs';

const matchPassword = async function (entered_password, user_passwrod) {
    return await bcryptjs.compare(entered_password, user_passwrod)
}

export default matchPassword;