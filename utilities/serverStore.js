const connected_users = new Map();

let io = null;

export const set_socket_server_instance = (io_instance) => {
    io = io_instance
}

export const get_socket_server_instance = () => {
    return io;
}

export const addNewConnectedUser = ({ socketId, userId }) => {
    connected_users.set(socketId, userId);
};

export const GetUserSockets = (user_Id) => {
    const active_users = [];
    const activeSockets = [];
    if (user_Id !== null || user_Id !== undefined) {
        connected_users.forEach((value, key) => {
            active_users.push({
                socket_id: key,
                user_id: value
            });
        })
        active_users.forEach((data) => {
            if (data.user_id === user_Id) {
                activeSockets.push(data.socket_id)
            }
        });
    }
    return activeSockets;
}
export const OtherSockets = (user_Id) => {
    const otherUsers = [];
    const otherSockets = [];
    if (user_Id !== null || user_Id !== undefined) {
        connected_users.forEach((value, key) => {
            otherUsers.push({
                socket_id: key,
                user_id: value
            });
        })
        otherUsers.forEach((data) => {
            if (data.user_id !== user_Id) {
                otherSockets.push(data.socket_id)
            }
        });
    }
    return otherSockets;
}

export const deleteConnectedUser = (socketId) => {
    if (connected_users.has(socketId)) {
        connected_users.delete(socketId);
    }
}

export const Get_User_By_Socket = (socket_id) => {
    const active_users = [];
    if (socket_id !== null || socket_id !== undefined) {
        connected_users.forEach((value, key) => {
            active_users.push({
                socket_id: key,
                user_id: value.userId
            })
        })
        const user_socket = active_users.filter((data) => {
            return data.socket_id === socket_id
        });
        return user_socket[0]?.user_id
    }
}