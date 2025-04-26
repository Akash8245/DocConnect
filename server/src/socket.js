module.exports = (io) => {
  // Store connected users
  const users = {};
  // Store active rooms
  const rooms = {};

  io.on('connection', (socket) => {
    console.log('New user connected:', socket.id);

    // User joins with their ID
    socket.on('userJoined', ({ userId }) => {
      users[socket.id] = userId;
      console.log(`User ${userId} mapped to socket ${socket.id}`);
    });

    // User joins a room for video call
    socket.on('joinRoom', ({ roomId, userId }) => {
      console.log(`User ${userId} joining room ${roomId}`);
      
      // Join the room
      socket.join(roomId);
      
      // Initialize room if it doesn't exist
      if (!rooms[roomId]) {
        rooms[roomId] = [];
      }
      
      // Add user to the room
      rooms[roomId].push({
        socketId: socket.id,
        userId
      });
      
      // Notify other users in the room
      const usersInRoom = rooms[roomId].filter(user => user.socketId !== socket.id);
      socket.emit('roomUsers', usersInRoom);
      
      // Notify the room that a new user joined
      socket.to(roomId).emit('userJoinedRoom', {
        socketId: socket.id,
        userId
      });
    });

    // WebRTC signaling: Offer
    socket.on('sendOffer', ({ offer, to, from }) => {
      console.log(`Sending offer from ${from} to ${to}`);
      io.to(to).emit('receiveOffer', {
        offer,
        from: socket.id
      });
    });

    // WebRTC signaling: Answer
    socket.on('sendAnswer', ({ answer, to, from }) => {
      console.log(`Sending answer from ${from} to ${to}`);
      io.to(to).emit('receiveAnswer', {
        answer,
        from: socket.id
      });
    });

    // WebRTC signaling: ICE candidate
    socket.on('sendIceCandidate', ({ candidate, to, from }) => {
      io.to(to).emit('receiveIceCandidate', {
        candidate,
        from: socket.id
      });
    });

    // User leaves a room
    socket.on('leaveRoom', ({ roomId, userId }) => {
      console.log(`User ${userId} leaving room ${roomId}`);
      
      // Remove user from the room
      if (rooms[roomId]) {
        rooms[roomId] = rooms[roomId].filter(user => user.socketId !== socket.id);
        
        // Clean up empty rooms
        if (rooms[roomId].length === 0) {
          delete rooms[roomId];
        } else {
          // Notify others that user has left
          socket.to(roomId).emit('userLeftRoom', {
            socketId: socket.id,
            userId
          });
        }
      }
      
      socket.leave(roomId);
    });

    // User disconnects
    socket.on('disconnect', () => {
      const userId = users[socket.id];
      console.log(`User disconnected: ${userId || socket.id}`);
      
      // Clean up user from all rooms
      Object.keys(rooms).forEach(roomId => {
        if (rooms[roomId]) {
          const userInRoom = rooms[roomId].find(user => user.socketId === socket.id);
          
          if (userInRoom) {
            // Remove user from room
            rooms[roomId] = rooms[roomId].filter(user => user.socketId !== socket.id);
            
            // Notify others that user has left
            socket.to(roomId).emit('userLeftRoom', {
              socketId: socket.id,
              userId: userInRoom.userId
            });
            
            // Clean up empty rooms
            if (rooms[roomId].length === 0) {
              delete rooms[roomId];
            }
          }
        }
      });
      
      // Remove user from users list
      delete users[socket.id];
    });
  });
}; 