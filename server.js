const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

io.on('connection', socket => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });

    socket.on('offer', offer => {
        // Forward offer to the other peer
        socket.broadcast.emit('offer', offer);
    });

    socket.on('answer', answer => {
        // Forward answer to the other peer
        socket.broadcast.emit('answer', answer);
    });

    socket.on('icecandidate', candidate => {
        // Forward ICE candidate to the other peer
        socket.broadcast.emit('icecandidate', candidate);
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
