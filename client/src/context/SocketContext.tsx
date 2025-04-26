import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { createPeerConnection } from '../services/webrtc';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  startCall: () => Promise<void>;
  endCall: () => void;
  currentRoom: string | null;
  isCallActive: boolean;
  users: { socketId: string; userId: string }[];
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

// Helper hook for using the socket context
export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [peers, setPeers] = useState<Map<string, Peer.Instance>>(new Map());
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [isCallActive, setIsCallActive] = useState<boolean>(false);
  const [users, setUsers] = useState<{ socketId: string; userId: string }[]>([]);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io({
      path: '/socket.io'
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Register user ID with socket when user and socket are available
  useEffect(() => {
    if (socket && user) {
      socket.emit('userJoined', { userId: user._id });
    }
  }, [socket, user]);

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Handle existing users in the room
    socket.on('roomUsers', (roomUsers) => {
      console.log('Users in room:', roomUsers);
      setUsers(roomUsers);

      // Create peer connections with existing users
      if (localStream) {
        roomUsers.forEach((remoteUser) => {
          createPeerConnection(remoteUser.socketId, socket.id, localStream);
        });
      }
    });

    // Handle new user joined
    socket.on('userJoinedRoom', (user) => {
      console.log('New user joined:', user);
      setUsers(prev => [...prev, user]);
    });

    // Handle user left room
    socket.on('userLeftRoom', (user) => {
      console.log('User left:', user);
      setUsers(prev => prev.filter(u => u.socketId !== user.socketId));
      
      // Close and remove peer connection
      if (peers.has(user.socketId)) {
        peers.get(user.socketId)?.destroy();
        const newPeers = new Map(peers);
        newPeers.delete(user.socketId);
        setPeers(newPeers);
      }

      // Remove remote stream
      if (remoteStreams.has(user.socketId)) {
        const newStreams = new Map(remoteStreams);
        newStreams.delete(user.socketId);
        setRemoteStreams(newStreams);
      }
    });

    // Handle incoming WebRTC offer
    socket.on('receiveOffer', async ({ offer, from }) => {
      console.log('Received offer from:', from);
      if (!localStream) return;

      // Create peer for answering
      const peer = createPeerConnection(from, socket.id, localStream, offer);
      
      // The peer will handle the offer and answer internally through signaling
      // We don't need to directly access the RTCPeerConnection (_pc)
    });

    // Handle incoming WebRTC answer
    socket.on('receiveAnswer', ({ answer, from }) => {
      console.log('Received answer from:', from);
      const peer = peers.get(from);
      if (peer) {
        peer.signal(answer);
      }
    });

    // Handle incoming ICE candidate
    socket.on('receiveIceCandidate', ({ candidate, from }) => {
      const peer = peers.get(from);
      if (peer) {
        peer.signal({ candidate });
      }
    });

    return () => {
      socket.off('roomUsers');
      socket.off('userJoinedRoom');
      socket.off('userLeftRoom');
      socket.off('receiveOffer');
      socket.off('receiveAnswer');
      socket.off('receiveIceCandidate');
    };
  }, [socket, localStream, peers, remoteStreams]);

  // Function to create a new peer connection
  const createPeerConnection = (
    remotePeerId: string, 
    localPeerId: string, 
    stream: MediaStream, 
    incomingOffer: RTCSessionDescriptionInit | null = null
  ) => {
    const peer = createPeerConnection({
      initiator: !incomingOffer,
      stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    // Handle peer events
    peer.on('signal', data => {
      if (data.type === 'offer') {
        socket?.emit('sendOffer', {
          offer: data,
          to: remotePeerId,
          from: localPeerId
        });
      } else if (data.type === 'answer') {
        socket?.emit('sendAnswer', {
          answer: data,
          to: remotePeerId,
          from: localPeerId
        });
      } else if (data.candidate) {
        socket?.emit('sendIceCandidate', {
          candidate: data,
          to: remotePeerId,
          from: localPeerId
        });
      }
    });

    peer.on('stream', (remoteStream: MediaStream) => {
      console.log('Received remote stream from:', remotePeerId);
      setRemoteStreams(prev => new Map(prev.set(remotePeerId, remoteStream)));
    });

    peer.on('close', () => {
      console.log('Peer connection closed with:', remotePeerId);
      peers.get(remotePeerId)?.destroy();
      const newPeers = new Map(peers);
      newPeers.delete(remotePeerId);
      setPeers(newPeers);

      const newStreams = new Map(remoteStreams);
      newStreams.delete(remotePeerId);
      setRemoteStreams(newStreams);
    });

    peer.on('error', (err) => {
      console.error('Peer connection error:', err);
    });

    // If we received an offer, signal it to the peer
    if (incomingOffer) {
      peer.signal(incomingOffer);
    }

    // Store the peer connection
    setPeers(prev => new Map(prev.set(remotePeerId, peer)));
    return peer;
  };

  // Join a room for video call
  const joinRoom = useCallback((roomId: string) => {
    if (!socket || !user) return;

    setCurrentRoom(roomId);
    socket.emit('joinRoom', { roomId, userId: user._id });
  }, [socket, user]);

  // Leave the current room
  const leaveRoom = useCallback(() => {
    if (!socket || !currentRoom || !user) return;

    socket.emit('leaveRoom', { roomId: currentRoom, userId: user._id });
    setCurrentRoom(null);
    setUsers([]);

    // Close all peer connections
    peers.forEach(peer => peer.destroy());
    setPeers(new Map());
    setRemoteStreams(new Map());
  }, [socket, currentRoom, user, peers]);

  // Start video call
  const startCall = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setLocalStream(stream);
      setIsCallActive(true);
      
      // Create peer connections with existing users in the room
      users.forEach(remoteUser => {
        if (socket) {
          createPeerConnection(remoteUser.socketId, socket.id, stream);
        }
      });

      return stream;
    } catch (error) {
      console.error('Error getting media devices:', error);
      throw error;
    }
  }, [socket, users]);

  // End the video call
  const endCall = useCallback(() => {
    if (!localStream) return;

    // Stop all tracks in the local stream
    localStream.getTracks().forEach(track => track.stop());
    setLocalStream(null);
    setIsCallActive(false);

    // Close all peer connections
    peers.forEach(peer => peer.destroy());
    setPeers(new Map());
    setRemoteStreams(new Map());
  }, [localStream, peers]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      
      peers.forEach(peer => peer.destroy());
    };
  }, [localStream, peers]);

  const value = {
    socket,
    localStream,
    remoteStreams,
    joinRoom,
    leaveRoom,
    startCall,
    endCall,
    currentRoom,
    isCallActive,
    users
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}; 