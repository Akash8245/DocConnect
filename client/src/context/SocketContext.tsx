import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import Peer from 'simple-peer';
import { useAuth } from './AuthContext';

// Add global declaration for window.localMediaStream
declare global {
  interface Window {
    localMediaStream?: MediaStream;
  }
}

interface ContextProps {
  children: React.ReactNode;
}

interface SocketContextType {
  socket: Socket | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'failed';
  isMicOn: boolean;
  isVideoOn: boolean;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  startCall: (targetSocketId: string, isInitiator?: boolean) => void;
  endCall: () => void;
  toggleMicrophone: () => void;
  toggleVideo: () => void;
  usersInRoom: any[];
  currentRoom: string | null;
  forceConnect: (targetSocketId: string) => void;
  prepareLocalMedia: () => Promise<MediaStream | null>;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }: ContextProps) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'failed'>('disconnected');
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [usersInRoom, setUsersInRoom] = useState<any[]>([]);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  
  const peerRef = useRef<Peer.Instance | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  
  // Removed sound-related code to avoid 403 errors
  // We'll implement this in a different way later
  
  // Initialize socket connection
  useEffect(() => {
    console.log('Initializing socket connection');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    console.log('Socket connecting to:', apiUrl);
    
    try {
      const newSocket = io(apiUrl, {
        transports: ['websocket', 'polling'],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5,
        timeout: 10000
      });

      // Immediately setup event handlers to avoid missing messages
      setupSocketListeners(newSocket);

      newSocket.on('connect', () => {
        console.log('Socket connected with ID:', newSocket.id);
      });
      
      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      setSocket(newSocket);

      return () => {
        console.log('Disconnecting socket');
        try {
          if (newSocket.connected) {
            newSocket.disconnect();
          }
        } catch (err) {
          console.error('Error disconnecting socket:', err);
        }
      };
    } catch (err) {
      console.error('Failed to create socket connection:', err);
      return () => {};
    }
  }, []);

  // Setup socket event listeners
  const setupSocketListeners = useCallback((socketInstance: Socket) => {
    console.log('Setting up socket event listeners');
    
    // Handle user joined room
    socketInstance.on('userJoinedRoom', (data) => {
      console.log('User joined room:', data);
      setUsersInRoom(prev => {
        // Avoid duplicate entries
        if (prev.some(u => u.socketId === data.socketId)) {
          return prev;
        }
        return [...prev, data];
      });
    });
    
    // Handle room users list
    socketInstance.on('roomUsers', (users) => {
      console.log('Received room users list:', users);
      setUsersInRoom(users);
    });

    // Handle incoming offers
    socketInstance.on('receiveOffer', async (data) => {
      console.log('Received offer from peer', data);
      
      if (!localStreamRef.current) {
        console.error('Cannot answer: No local stream available');
        await initializeMediaStream();
      }
      
      if (!localStreamRef.current) {
        console.error('Failed to initialize media stream for answering call');
        setConnectionStatus('failed');
        return;
      }
      
      setConnectionStatus('connecting');
      
      // Create new peer as signal receiver
      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream: localStreamRef.current,
      });
      
      peerRef.current = peer;
      
      // Handle peer signals
      peer.on('signal', (signal) => {
        console.log('Local peer generated signal (answer)', signal.type);
        socketInstance.emit('sendAnswer', {
          roomId: currentRoom,
          signal,
          from: user?._id,
          to: data.from,
        });
      });
      
      // Handle stream from remote peer
      peer.on('stream', (stream) => {
        console.log('Received remote stream from peer');
        setRemoteStream(stream);
        setConnectionStatus('connected');
      });
      
      // Handle peer errors
      peer.on('error', (err) => {
        console.error('Peer error:', err);
        setConnectionStatus('failed');
      });
      
      // Handle peer close
      peer.on('close', () => {
        console.log('Peer connection closed');
        setConnectionStatus('disconnected');
        cleanupPeerConnection();
      });
      
      // Signal the peer with the received offer
      try {
        peer.signal(data.offer);
      } catch (err) {
        console.error('Error processing offer:', err);
      }
    });

    // Handle incoming answers
    socketInstance.on('receiveAnswer', (data) => {
      console.log('Received answer from peer', data);
      
      if (peerRef.current) {
        try {
          peerRef.current.signal(data.answer);
        } catch (err) {
          console.error('Error processing answer:', err);
        }
      } else {
        console.error('No peer connection to handle answer');
      }
    });

    // Handle ice candidate exchanges
    socketInstance.on('receiveIceCandidate', (data) => {
      console.log('Received ICE candidate from peer');
      if (peerRef.current) {
        try {
          peerRef.current.signal(data.candidate);
        } catch (err) {
          console.error('Error processing ICE candidate:', err);
        }
      } else {
        console.error('No peer connection to handle ICE candidate');
      }
    });

    // Handle user disconnection
    socketInstance.on('userLeftRoom', (data) => {
      console.log('Remote user disconnected:', data);
      setConnectionStatus('disconnected');
      setRemoteStream(null);
      cleanupPeerConnection();
      
      // Update the users in room
      setUsersInRoom(prev => prev.filter(u => u.socketId !== data.socketId));
    });
    
  }, [user?._id, currentRoom]);

  // Initialize media stream (camera and microphone)
  const initializeMediaStream = useCallback(async () => {
    try {
      if (!localStreamRef.current) {
        console.log('Initializing media stream...');
        
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
          });
          
          localStreamRef.current = stream;
          setLocalStream(stream);
          
          // Initialize with mic and video on
          setIsMicOn(true);
          setIsVideoOn(true);
          
          console.log('Media stream initialized successfully');
          return stream;
        } catch (mediaError: any) {
          console.error('Error accessing media devices:', mediaError);
          
          if (mediaError.name === 'NotAllowedError') {
            console.log('Permission denied, trying to access only audio');
            
            try {
              // Try with only audio as fallback
              const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
                video: false,
                audio: true
              });
              
              localStreamRef.current = audioOnlyStream;
              setLocalStream(audioOnlyStream);
              setIsMicOn(true);
              setIsVideoOn(false);
              
              console.log('Audio-only stream initialized');
              return audioOnlyStream;
            } catch (audioError) {
              console.error('Failed to access even audio-only:', audioError);
              setConnectionStatus('failed');
              return null;
            }
          } else {
            setConnectionStatus('failed');
            return null;
          }
        }
      }
      return localStreamRef.current;
    } catch (error) {
      console.error('Unexpected error accessing media devices:', error);
      setConnectionStatus('failed');
      return null;
    }
  }, []);

  // Clean up peer connection
  const cleanupPeerConnection = useCallback(() => {
    console.log('Cleaning up peer connection');
    if (peerRef.current) {
      try {
        peerRef.current.destroy();
      } catch (e) {
        console.error('Error destroying peer:', e);
      }
      peerRef.current = null;
    }
  }, []);

  // Join a video call room
  const joinRoom = useCallback(async (roomId: string) => {
    if (!socket) {
      console.error('Cannot join room: Socket not connected');
      return;
    }
    
    if (!user?._id) {
      console.error('Cannot join room: User not authenticated');
      return;
    }
    
    console.log(`Joining room ${roomId} as user ${user._id}`);
    setCurrentRoom(roomId);
    
    // Ensure we have a media stream before joining the room
    // This is one of the places where we explicitly initialize media
    await initializeMediaStream();
    
    socket.emit('joinRoom', {
      roomId,
      userId: user._id
    });
    
    setConnectionStatus('disconnected');
    
    // Set up a timer to retry joining if we don't get room users
    setTimeout(() => {
      console.log('Checking for room users after timeout');
      if (usersInRoom.length === 0) {
        console.log('No users received, re-emitting join room');
        socket.emit('joinRoom', {
          roomId,
          userId: user._id
        });
      }
    }, 3000);
    
  }, [socket, user, initializeMediaStream, usersInRoom.length]);

  // Start a WebRTC call
  const startCall = useCallback(async (targetSocketId: string, isInitiator = true) => {
    if (!socket) {
      console.error('Socket not initialized');
      return;
    }
    
    if (!currentRoom) {
      console.error('No room joined');
      return;
    }
    
    console.log(`Starting call with ${targetSocketId}, initiator: ${isInitiator}`);
    setConnectionStatus('connecting');
    
    // Ensure peer is cleaned up before starting a new call
    cleanupPeerConnection();
    
    // Ensure media stream is available
    let stream: MediaStream | null;
    if (!localStreamRef.current) {
      stream = await initializeMediaStream();
      if (!stream) {
        console.error('Failed to get local media stream');
        setConnectionStatus('failed');
        return;
      }
    } else {
      stream = localStreamRef.current;
    }
    
    // Create a new WebRTC peer connection
    try {
      // Enhanced ICE server configuration for better connectivity
      // especially for same-device testing
      const peer = new Peer({
        initiator: isInitiator,
        trickle: true,
        stream: stream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' },
            {
              urls: 'turn:relay.metered.ca:80',
              username: 'openrelay',
              credential: 'openrelay',
            },
          ],
          iceTransportPolicy: 'all',
          sdpSemantics: 'unified-plan'
        },
        sdpTransform: (sdp) => {
          console.log('Transforming SDP for better same-device compatibility');
          return sdp;
        }
      });
      
      peerRef.current = peer;
      
      // Set a shorter timeout for connection status
      const failureTimeout = setTimeout(() => {
        if (connectionStatus === 'connecting') {
          console.log('Connection still in connecting state after timeout - setting to failed');
          setConnectionStatus('failed');
        }
      }, 10000); // Reduced from 15000ms to 10000ms
      
      // Handle WebRTC signaling
      peer.on('signal', (data) => {
        console.log('WebRTC signaling event:', data.type || 'ICE candidate');
        
        if (data.type === 'offer') {
          console.log('Sending offer to room:', currentRoom);
          socket.emit('sendOffer', {
            roomId: currentRoom,
            offer: data,
            from: user?._id
          });
        } else if (data.type === 'answer') {
          console.log('Sending answer to:', targetSocketId);
          socket.emit('sendAnswer', {
            roomId: currentRoom,
            signal: data,
            from: user?._id,
            to: targetSocketId
          });
        } else {
          // This is an ICE candidate
          console.log('Sending ICE candidate to:', targetSocketId);
          socket.emit('sendIceCandidate', {
            roomId: currentRoom,
            candidate: data,
            from: user?._id,
            to: targetSocketId
          });
        }
      });
      
      // Handle peer connection establishing
      peer.on('connect', () => {
        console.log('Peer connection established');
        setConnectionStatus('connected');
        clearTimeout(failureTimeout); // Clear the timeout when connected
      });
      
      // Handle remote stream
      peer.on('stream', (remoteMediaStream) => {
        console.log('Received remote stream');
        setRemoteStream(remoteMediaStream);
        setConnectionStatus('connected');
        clearTimeout(failureTimeout); // Clear the timeout when stream received
      });
      
      // Handle peer errors
      peer.on('error', (err) => {
        console.error('Peer connection error:', err);
        setConnectionStatus('failed');
        clearTimeout(failureTimeout);
      });
      
      // Handle peer connection closed
      peer.on('close', () => {
        console.log('Peer connection closed');
        setConnectionStatus('disconnected');
        setRemoteStream(null);
        clearTimeout(failureTimeout);
      });
      
      console.log('Peer connection initialized');
      
    } catch (error) {
      console.error('Error creating peer:', error);
      setConnectionStatus('failed');
    }
  }, [
    socket, 
    currentRoom, 
    user?._id, 
    cleanupPeerConnection, 
    initializeMediaStream,
    connectionStatus
  ]);

  // Force connect - useful for same-device testing
  const forceConnect = useCallback((targetSocketId: string) => {
    console.log('Force connecting to:', targetSocketId);
    
    // For same-device testing, we need to ensure cleanup before starting a new connection
    cleanupPeerConnection();
    
    // Delay slightly to ensure cleanup is complete
    setTimeout(async () => {
      console.log('Starting connection after cleanup');
      
      // Force reconnection of local media if needed
      if (!localStreamRef.current) {
        console.log('No local stream available, initializing...');
        const stream = await initializeMediaStream();
        if (stream) {
          console.log('Local stream initialized, starting call');
          // Always be the initiator for forced connections
          startCall(targetSocketId, true);
        } else {
          console.error('Failed to initialize media stream for forced connection');
        }
      } else {
        // Local stream already available, start call immediately
        console.log('Using existing local stream');
        startCall(targetSocketId, true);
      }
    }, 500);
    
  }, [startCall, cleanupPeerConnection, initializeMediaStream]);

  // Handle incoming WebRTC offer
  const handleIncomingOffer = useCallback(async (offer: any, fromSocketId: string) => {
    console.log('Handling incoming offer from:', fromSocketId);
    
    // Wait a moment to ensure streams are initialized
    setTimeout(() => {
      startCall(fromSocketId, false);
      
      // Signal the offer after a short delay to ensure the peer is ready
      setTimeout(() => {
        if (peerRef.current) {
          try {
            peerRef.current.signal(offer);
          } catch (error) {
            console.error('Error signaling offer to peer:', error);
            setConnectionStatus('failed');
          }
        } else {
          console.error('Peer not initialized when receiving offer');
          setConnectionStatus('failed');
        }
      }, 500);
    }, 500);
  }, [startCall]);

  // Leave the current room
  const leaveRoom = useCallback((roomId: string) => {
    if (!socket) return;
    
    console.log(`Leaving room ${roomId}`);
    
    socket.emit('leaveRoom', {
      roomId,
      userId: user?._id
    });
    
    // Clean up WebRTC connection
    cleanupPeerConnection();
    
    // Also release media resources when leaving the room
    if (localStreamRef.current) {
      console.log('Releasing media resources when leaving room');
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      localStreamRef.current = null;
      setLocalStream(null);
    }
    
    setCurrentRoom(null);
    setRemoteStream(null);
    setConnectionStatus('disconnected');
    setUsersInRoom([]);
  }, [socket, user?._id, cleanupPeerConnection]);

  // End the current call
  const endCall = useCallback(() => {
    console.log('Ending call');
    
    cleanupPeerConnection();
    setRemoteStream(null);
    setConnectionStatus('disconnected');
    
    // Stop and release camera/mic access completely when call ends
    if (localStreamRef.current) {
      console.log('Stopping and releasing media tracks');
      localStreamRef.current.getTracks().forEach(track => {
        console.log(`Stopping track: ${track.kind}`);
        track.stop();
      });
      localStreamRef.current = null;
      setLocalStream(null);
    }
  }, [cleanupPeerConnection]);

  // Toggle microphone
  const toggleMicrophone = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const newState = !isMicOn;
        audioTracks.forEach(track => {
          track.enabled = newState;
        });
        setIsMicOn(newState);
        console.log(`Microphone turned ${newState ? 'on' : 'off'}`);
      }
    }
  }, [isMicOn]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        const newState = !isVideoOn;
        videoTracks.forEach(track => {
          track.enabled = newState;
        });
        setIsVideoOn(newState);
        console.log(`Video turned ${newState ? 'on' : 'off'}`);
      }
    }
  }, [isVideoOn]);
  
  // No automatic media stream initialization
  // We'll only initialize when joinRoom is called or when explicitly requested
  // This prevents camera access on pages other than the video call page

  // Re-initialize socket if it disconnects
  useEffect(() => {
    if (socket) {
      socket.on('disconnect', () => {
        console.log('Socket disconnected');
        
        // If we're in a room, log that information
        if (currentRoom) {
          console.log(`We were in room ${currentRoom} when disconnected`);
        }
      });
      
      socket.io.on('reconnect', () => {
        console.log('Socket reconnected');
        
        // If we were in a room, rejoin it
        if (currentRoom && user?._id) {
          console.log(`Rejoining room ${currentRoom} after reconnection`);
          socket.emit('joinRoom', {
            roomId: currentRoom,
            userId: user._id
          });
        }
      });
      
      return () => {
        socket.off('disconnect');
        socket.io.off('reconnect');
      };
    }
  }, [socket, currentRoom, user]);

  // Add this function implementation
  const prepareLocalMedia = useCallback(async () => {
    console.log('Explicitly preparing local media');
    return await initializeMediaStream();
  }, [initializeMediaStream]);

  // Add cleanup for media when socket provider unmounts
  useEffect(() => {
    return () => {
      // Clean up media streams when component unmounts
      if (localStreamRef.current) {
        console.log('Cleaning up media streams on unmount');
        localStreamRef.current.getTracks().forEach(track => {
          track.stop();
        });
        localStreamRef.current = null;
        setLocalStream(null);
      }
    };
  }, []);

  const value = {
    socket,
    localStream,
    remoteStream,
    connectionStatus,
    isMicOn,
    isVideoOn,
    joinRoom,
    leaveRoom,
    startCall,
    endCall,
    toggleMicrophone,
    toggleVideo,
    usersInRoom,
    currentRoom,
    forceConnect,
    prepareLocalMedia
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}; 