import { Server as SocketIOServer } from 'socket.io';
import { Server } from 'http';

let io: SocketIOServer;

export const initSocket = (server: Server) => {
    io = new SocketIOServer(server, { cors: { origin: '*' } });
    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);
    });
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};