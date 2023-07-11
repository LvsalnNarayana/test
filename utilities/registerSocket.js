import { Server } from 'socket.io';
import {
    addNewConnectedUser,
    deleteConnectedUser,
    set_socket_server_instance
} from './serverStore.js';
import { sessionMiddleware } from './sessionMiddleware.js';
export const registerSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "http://localhost:3000",
            credentials: true,
        }
    });
    set_socket_server_instance(io);
    io.use((socket, next) => {
        sessionMiddleware(socket.request, {}, next)
    })
    io.on('connection', (socket) => {
        addNewConnectedUser({ socketId: socket.id, userId: socket?.request?.session?.user?.id })

        // Handle client disconnection
        socket.on('disconnect', () => {
            deleteConnectedUser(socket?.id)
        });
    });
    return io
}