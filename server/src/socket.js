module.exports = (io) => {
  // Store connected users
  const users = {};
  // Store active rooms
  const rooms = {};

  // Debug endpoint for checking room status
  io.of('/admin').on('connection', (socket) => {
    console.log('Admin socket connected:', socket.id);
    
    // Send rooms data immediately upon connection
    socket.emit('roomsStatus', {
      rooms,
      totalUsers: Object.keys(users).length,
      totalRooms: Object.keys(rooms).length
    });
    
    // Allow requesting room status
    socket.on('getRoomsStatus', () => {
      socket.emit('roomsStatus', {
        rooms,
        totalUsers: Object.keys(users).length,
        totalRooms: Object.keys(rooms).length
      });
    });
  });

  io.on('connection', (socket) => {
    console.log('New user connected:', socket.id);

    // Broadcast available rooms for same-device testing
    socket.emit('availableRooms', Object.keys(rooms));
    
    // Diagnostic method to get room status
    socket.on('getRoomStatus', (roomId) => {
      console.log(`Room status requested for ${roomId}`);
      const roomExists = !!rooms[roomId];
      const roomUsers = rooms[roomId] || [];
      socket.emit('roomStatus', {
        roomId,
        exists: roomExists,
        users: roomUsers,
        userCount: roomUsers.length
      });
    });

    // User joins a room for video call
    socket.on('joinRoom', ({ roomId, userId }) => {
      console.log(`User ${userId} joining room ${roomId} with socket ${socket.id}`);
      
      // Store user ID mapping
      users[socket.id] = userId;
      
      // Join the socket.io room
      socket.join(roomId);
      
      // Initialize room if it doesn't exist
      if (!rooms[roomId]) {
        rooms[roomId] = [];
        // Broadcast new room creation for same-device testing
        io.emit('availableRooms', Object.keys(rooms));
        console.log(`Created new room: ${roomId}`);
      }
      
      // Add user to the room if not already there
      let existingUser = rooms[roomId].find(user => 
        user.socketId === socket.id
      );
      
      if (!existingUser) {
        rooms[roomId].push({
          socketId: socket.id,
          userId
        });
        
        console.log(`Added user ${userId} with socket ${socket.id} to room ${roomId}`);
      } else {
        console.log(`User ${userId} already in room ${roomId}`);
      }
      
      // Notify the user about other users in the room
      const otherUsers = rooms[roomId].filter(user => user.socketId !== socket.id);
      socket.emit('roomUsers', otherUsers);
      
      console.log(`Room ${roomId} users (${rooms[roomId].length}): ${JSON.stringify(rooms[roomId])}`);
      
      // Notify the room that a new user joined
      socket.to(roomId).emit('userJoinedRoom', {
        socketId: socket.id,
        userId
      });
      
      // Send multiple notifications to ensure delivery
      // Critical for same-device testing in different browsers
      setTimeout(() => {
        socket.to(roomId).emit('userJoinedRoom', {
          socketId: socket.id,
          userId
        });
        
        // Also rebroadcast the complete user list to this socket
        socket.emit('roomUsers', otherUsers);
      }, 1000);
      
      setTimeout(() => {
        socket.to(roomId).emit('userJoinedRoom', {
          socketId: socket.id,
          userId
        });
      }, 2000);
    });

    // WebRTC signaling: Offer
    socket.on('sendOffer', ({ roomId, offer, from }) => {
      console.log(`Received offer from ${from} (socket: ${socket.id}) in room ${roomId}`);
      
      if (!rooms[roomId]) {
        console.error(`Room ${roomId} not found when sending offer`);
        socket.emit('signalError', { message: `Room ${roomId} not found`, type: 'room-not-found' });
        return;
      }
      
      // Find other users in the room to send the offer to
      const otherUsers = rooms[roomId].filter(user => user.socketId !== socket.id) || [];
      
      if (otherUsers.length === 0) {
        console.log(`No other users in room ${roomId} to send offer to`);
        socket.emit('signalError', { message: 'No other users in room', type: 'room-empty' });
        return;
      }
      
      // Log all users in the room for debugging
      console.log(`Room ${roomId} has users: ${JSON.stringify(rooms[roomId])}`);
      
      // For simplicity in 1:1 calls, send to all other users
      otherUsers.forEach(targetUser => {
        console.log(`Sending offer to ${targetUser.userId} (socket: ${targetUser.socketId})`);
        
        // Send multiple offers to ensure delivery
        // Critical for same-device testing
        io.to(targetUser.socketId).emit('receiveOffer', {
          offer,
          from: socket.id
        });
        
        // Repeat sending for reliability
        setTimeout(() => {
          io.to(targetUser.socketId).emit('receiveOffer', {
            offer,
            from: socket.id
          });
        }, 500);
        
        setTimeout(() => {
          io.to(targetUser.socketId).emit('receiveOffer', {
            offer,
            from: socket.id
          });
        }, 1500);
      });
    });

    // WebRTC signaling: Answer
    socket.on('sendAnswer', ({ roomId, signal, from, to }) => {
      console.log(`Received answer from ${from} (socket: ${socket.id}) to ${to}`);
      
      // Send multiple answers to ensure delivery
      io.to(to).emit('receiveAnswer', {
        answer: signal,
        from: socket.id
      });
      
      // Repeat sending for reliability
      setTimeout(() => {
        io.to(to).emit('receiveAnswer', {
          answer: signal,
          from: socket.id
        });
      }, 500);
      
      setTimeout(() => {
        io.to(to).emit('receiveAnswer', {
          answer: signal,
          from: socket.id
        });
      }, 1500);
    });

    // WebRTC signaling: ICE candidate
    socket.on('sendIceCandidate', ({ roomId, candidate, from, to }) => {
      console.log(`Received ICE candidate from ${from} for ${to}`);
      
      io.to(to).emit('receiveIceCandidate', {
        candidate,
        from: socket.id
      });
      
      // For reliable delivery, especially in same-device testing
      setTimeout(() => {
        io.to(to).emit('receiveIceCandidate', {
          candidate,
          from: socket.id
        });
      }, 100);
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
      
      // Find the user in the room by socket ID
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
          // Broadcast updated room list
          io.emit('availableRooms', Object.keys(rooms));
        }
      }
    }
  });
}; 