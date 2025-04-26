module.exports = (io) => {
  // Store connected users
  const users = {};
  // Store active rooms
  const rooms = {};

  io.on('connection', (socket) => {
    console.log('New user connected:', socket.id);

    // User joins a room for video call
    socket.on('joinRoom', ({ roomId, userId }) => {
      console.log(`User ${userId} joining room ${roomId} with socket ${socket.id}`);
      
      // Store user ID mapping
      users[socket.id] = userId;
      
      // Join the room
      socket.join(roomId);
      
      // Initialize room if it doesn't exist
      if (!rooms[roomId]) {
        rooms[roomId] = [];
      }
      
      // Add user to the room if not already there
      // For same-device testing, we need to handle multiple connections for the same userId
      let existingUser = rooms[roomId].find(user => 
        user.socketId === socket.id
      );
      
      if (!existingUser) {
        rooms[roomId].push({
          socketId: socket.id,
          userId
        });
        
        console.log(`Added user ${userId} with socket ${socket.id} to room ${roomId}`);
      }
      
      // Notify the user about other users in the room
      // For same-device testing, we need to exclude the current socket, not just the userId
      const otherUsers = rooms[roomId].filter(user => user.socketId !== socket.id);
      socket.emit('roomUsers', otherUsers);
      
      console.log(`Room ${roomId} users: ${JSON.stringify(rooms[roomId])}`);
      
      // Notify the room that a new user joined
      socket.to(roomId).emit('userJoinedRoom', {
        socketId: socket.id,
        userId
      });
      
      // Retry notification after a short delay to handle race conditions
      setTimeout(() => {
        socket.to(roomId).emit('userJoinedRoom', {
          socketId: socket.id,
          userId
        });
      }, 1000);
    });

    // WebRTC signaling: Offer
    socket.on('sendOffer', ({ roomId, offer, from }) => {
      console.log(`Received offer from ${from} (socket: ${socket.id}) in room ${roomId}`);
      
      // Find other users in the room to send the offer to
      const otherUsers = rooms[roomId]?.filter(user => user.socketId !== socket.id) || [];
      
      if (otherUsers.length === 0) {
        console.log(`No other users in room ${roomId} to send offer to`);
        return;
      }
      
      // Log all users in the room for debugging
      console.log(`Room ${roomId} has users: ${JSON.stringify(rooms[roomId])}`);
      
      // For simplicity in 1:1 calls, send to all other users (helps with same-device testing)
      otherUsers.forEach(targetUser => {
        console.log(`Sending offer to ${targetUser.userId} (socket: ${targetUser.socketId})`);
        
        io.to(targetUser.socketId).emit('receiveOffer', {
          offer,
          from: socket.id
        });
      });
    });

    // WebRTC signaling: Answer
    socket.on('sendAnswer', ({ roomId, signal, from, to }) => {
      console.log(`Received answer from ${from} (socket: ${socket.id}) to ${to}`);
      
      io.to(to).emit('receiveAnswer', {
        answer: signal,
        from: socket.id
      });
    });

    // WebRTC signaling: ICE candidate
    socket.on('sendIceCandidate', ({ roomId, candidate, from, to }) => {
      console.log(`Received ICE candidate from ${from} for ${to}`);
      
      io.to(to).emit('receiveIceCandidate', {
        candidate,
        from: socket.id
      });
    });

    // User leaves a room
    socket.on('leaveRoom', ({ roomId, userId }) => {
      console.log(`User ${userId} leaving room ${roomId}`);
      handleUserLeaving(socket, roomId, userId);
    });

    // User disconnects
    socket.on('disconnect', () => {
      const userId = users[socket.id];
      console.log(`User disconnected: ${userId || socket.id}`);
      
      // Find all rooms this user is in and remove them
      Object.keys(rooms).forEach(roomId => {
        handleUserLeaving(socket, roomId, userId);
      });
      
      // Remove user from users list
      delete users[socket.id];
    });
    
    // Helper function to handle a user leaving
    function handleUserLeaving(socket, roomId, userId) {
      if (!rooms[roomId]) return;
      
      // Find the user in the room by socket ID (more reliable for same-device testing)
      const userIndex = rooms[roomId].findIndex(user => user.socketId === socket.id);
      
      if (userIndex !== -1) {
        // Get the user before removing
        const user = rooms[roomId][userIndex];
        
        // Remove user from room
        rooms[roomId].splice(userIndex, 1);
        
        // Leave the socket room
        socket.leave(roomId);
        
        // Notify others that user has left
        socket.to(roomId).emit('userLeftRoom', {
          socketId: user.socketId,
          userId: user.userId
        });
        
        console.log(`User ${user.userId} (socket: ${user.socketId}) left room ${roomId}, ${rooms[roomId].length} users remaining`);
        
        // Clean up empty rooms
        if (rooms[roomId].length === 0) {
          console.log(`Room ${roomId} is now empty, removing`);
          delete rooms[roomId];
        }
      }
    }
  });
}; 