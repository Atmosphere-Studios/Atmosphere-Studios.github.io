const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let rooms = {};

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('createRoom', (roomId) => {
        rooms[roomId] = { players: [socket.id], gameState: null };
        socket.join(roomId);
        socket.emit('roomCreated', roomId);
    });

    socket.on('joinRoom', (roomId) => {
        if (rooms[roomId] && rooms[roomId].players.length < 2) {
            rooms[roomId].players.push(socket.id);
            socket.join(roomId);
            io.to(roomId).emit('startGame', rooms[roomId].players);
        } else {
            socket.emit('roomFull');
        }
    });

    socket.on('playCard', (roomId, card) => {
        io.to(roomId).emit('cardPlayed', card);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
        for (let roomId in rooms) {
            rooms[roomId].players = rooms[roomId].players.filter(id => id !== socket.id);
            if (rooms[roomId].players.length === 0) {
                delete rooms[roomId];
            }
        }
    });
});

server.listen(4000, () => console.log('Server is running on port 4000'));