import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaPhoneSlash, FaRedo } from 'react-icons/fa';
import { Helmet } from 'react-helmet-async';

interface AppointmentDetails {
  _id: string;
  doctor: {
    _id: string;
    name: string;
    specialization: string;
    profilePicture?: string;
  };
  patient: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  date: string;
  startTime: string;
  endTime: string;
  status: string;
}

// Helper function to extract ID value regardless of format
const extractId = (value: any): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value._id) return value._id.toString();
  if (typeof value === 'object' && value.id) return value.id.toString();
  return value.toString();
};

const VideoCall = () => {
  // Check both possible parameter names (for compatibility)
  const params = useParams<{ id?: string; appointmentId?: string }>();
  const appointmentId = params.appointmentId || params.id;
  
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Early error check for missing appointment ID
  if (!appointmentId) {
    console.error("No appointment ID found in URL");
  }
  
  const {
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
  } = useSocket();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  
  // Add debugging state
  const [debugInfo, setDebugInfo] = useState({
    loadingStep: 'initializing',
    socketStatus: 'unknown',
    authStatus: 'unknown',
    appointmentStatus: 'unknown',
    lastError: ''
  });
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  // Track socket status changes
  useEffect(() => {
    setDebugInfo(prev => ({
      ...prev,
      socketStatus: socket ? 'connected' : 'disconnected'
    }));
  }, [socket]);
  
  // Track auth status changes
  useEffect(() => {
    setDebugInfo(prev => ({
      ...prev,
      authStatus: user ? 'authenticated' : 'unauthenticated'
    }));
  }, [user]);
  
  // Add effect to explicitly initialize media when the component mounts
  useEffect(() => {
    // Only initialize media if we have a socket connection
    if (socket) {
      console.log('VideoCall: Initializing media stream explicitly');
      prepareLocalMedia().catch(err => {
        console.error('Failed to initialize media stream:', err);
        setError('Could not access camera or microphone. Please check your permissions.');
      });
    }
  }, [socket, prepareLocalMedia]);
  
  // Connect local video stream to video element as soon as it's available
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      console.log('Connecting local video stream to video element');
      localVideoRef.current.srcObject = localStream;
      
      // If we have local stream, we can show the UI even if still loading appointment data
      if (loading && !appointment) {
        setDebugInfo(prev => ({ ...prev, loadingStep: 'got local stream, showing UI' }));
        // Only set loading to false if we have the minimum needed - local stream
        setLoading(false);
      }
    }
  }, [localStream, loading, appointment]);
  
  // Connect remote video stream to video element
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      console.log('Connecting remote video stream to video element');
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);
  
  // Fetch appointment details when component mounts
  useEffect(() => {
    const fetchAppointmentDetails = async () => {
      try {
        setDebugInfo(prev => ({ ...prev, loadingStep: 'fetching appointment' }));
        
        if (!appointmentId) {
          console.error("No appointment ID provided in URL");
          setError("No appointment ID provided. Please go back and try again.");
          setDebugInfo(prev => ({ 
            ...prev, 
            loadingStep: 'failed', 
            appointmentStatus: 'missing id',
            lastError: 'No appointment ID provided in URL'
          }));
          return;
        }
        
        console.log(`Attempting to fetch appointment ${appointmentId}`);
        
        // Get auth token
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.error("No authentication token found");
          setError('Authentication required. Please log in again.');
          setDebugInfo(prev => ({ 
            ...prev, 
            loadingStep: 'failed', 
            lastError: 'No auth token found'
          }));
          return;
        }
        
        try {
          // Make API request with auth token
          const response = await axios.get(`/api/appointments/${appointmentId}`, {
            headers: { 
              Authorization: `Bearer ${token}`
            }
          });
          
          if (!response.data || !response.data._id) {
            throw new Error("Invalid appointment data received");
          }
          
          console.log("Appointment data retrieved:", response.data);
          setAppointment(response.data);
          setDebugInfo(prev => ({ 
            ...prev, 
            loadingStep: 'appointment loaded',
            appointmentStatus: 'loaded'
          }));
        } catch (apiError: any) {
          console.error('API error fetching appointment details:', apiError);
          const errorMessage = apiError.response?.data?.message || 'Failed to load appointment details. Please try again.';
          setError(errorMessage);
          setDebugInfo(prev => ({ 
            ...prev, 
            loadingStep: 'failed', 
            appointmentStatus: 'api error',
            lastError: errorMessage
          }));
        }
      } catch (err: any) {
        console.error('Unexpected error fetching appointment details:', err);
        setError('An unexpected error occurred. Please refresh and try again.');
        setDebugInfo(prev => ({ 
          ...prev, 
          loadingStep: 'failed', 
          appointmentStatus: 'error',
          lastError: err.message || 'Unknown error'
        }));
      }
    };
    
    fetchAppointmentDetails();
  }, [appointmentId]);
  
  // Setup room joining when appointment data is loaded
  useEffect(() => {
    if (appointment && socket) {
      console.log("Appointment data loaded, socket available. Joining room...");
      setDebugInfo(prev => ({ ...prev, loadingStep: 'joining room' }));
      const roomId = `appointment-${appointment._id}`;
      console.log(`Joining room: ${roomId}`);
      joinRoom(roomId);
      
      return () => {
        if (currentRoom) {
          console.log(`Cleaning up - leaving room: ${currentRoom}`);
          leaveRoom(currentRoom);
          endCall();
        }
      };
    }
  }, [appointment, socket, joinRoom, leaveRoom, endCall, currentRoom]);
  
  // Clean up on component unmount
  useEffect(() => {
    return () => {
      console.log('VideoCall component unmounting, cleaning up resources');
      // End call and release media resources
      endCall();
    };
  }, [endCall]);
  
  // Setup WebRTC connection when users are in the room
  useEffect(() => {
    // Only initiate call if there are at least 2 users in the room (including ourselves)
    if (usersInRoom.length > 1 && socket && currentRoom) {
      console.log(`Found ${usersInRoom.length} users in room, current user: ${user?._id}`);
      console.log('Users in room:', usersInRoom);
      
      // Find other user to connect with (not ourselves)
      const otherUser = usersInRoom.find(u => u.userId !== user?._id);
      if (otherUser) {
        console.log('Found other user to connect with:', otherUser);
        // Start call to the other user
        startCall(otherUser.socketId, true);
      } else {
        console.log('No other users found to connect with');
      }
    }
  }, [usersInRoom, socket, currentRoom, user?._id, startCall]);
  
  // Force continue function for debugging
  const handleForceContinue = () => {
    console.log("Forcing continuation past loading screen");
    setLoading(false);
  };
  
  // Handle retry connection
  const handleRetry = () => {
    console.log("Retrying connection...");
    setRetryCount(prev => prev + 1);
    
    if (usersInRoom.length > 1) {
      const otherUser = usersInRoom.find(u => u.userId !== user?._id);
      if (otherUser) {
        console.log(`Retrying connection with ${otherUser.socketId}`);
        startCall(otherUser.socketId, true);
      } else {
        console.log("No other user found to connect with");
        setError("No other user found in the room. Please wait for the other participant to join.");
      }
    } else {
      console.log("No other users in room, cannot retry connection");
      setError("No other user found in the room. Please wait for the other participant to join.");
    }
  };
  
  // Handle end call and navigate away
  const handleEndCall = () => {
    endCall();
    navigate(-1);
  };
  
  // Toggle debug panel
  const toggleDebugPanel = () => {
    setShowDebugPanel(prev => !prev);
  };
  
  // Force connect to specific socket (for testing)
  const handleForceConnect = (socketId: string) => {
    console.log(`Force connecting to ${socketId}`);
    forceConnect(socketId);
  };
  
  // Handle same-device connection (enhanced for testing)
  const handleSameDeviceConnection = () => {
    console.log('Attempting enhanced same-device connection');
    
    if (usersInRoom.length > 1) {
      // Find other user to connect with (not ourselves)
      const otherUser = usersInRoom.find(u => u.userId !== user?._id);
      if (otherUser) {
        console.log(`Initiating enhanced connection with ${otherUser.socketId}`);
        forceConnect(otherUser.socketId);
        
        // Set a delay and retry if needed
        setTimeout(() => {
          if (connectionStatus !== 'connected') {
            console.log('Initial connection attempt did not succeed, retrying...');
            forceConnect(otherUser.socketId);
          }
        }, 3000);
      } else {
        console.error('No other user found for same-device connection');
        setError('No other user found in room. Both users must join the room first.');
      }
    } else {
      console.error('Not enough users for same-device connection');
      setError('Both users must join the same room before connecting.');
    }
  };
  
  // Calculate if current user is the doctor
  const isDoctor = user?.role === 'doctor';
  
  // Handle navigation to appointments
  const handleGoToAppointments = () => {
    const userRole = user?.role || 'patient';
    navigate(`/${userRole}/appointments`);
  };
  
  // Pure loading screen (no local stream yet)
  if (loading && !localStream) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-900">
        <div className="text-center p-6 max-w-md">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <h2 className="text-xl font-semibold text-white">Preparing Video Call...</h2>
          <p className="mt-2 text-gray-400">Setting up your camera and microphone</p>
          
          <div className="mt-6 p-4 bg-gray-800 rounded-lg text-left">
            <h3 className="text-sm font-medium text-white mb-2">Debug Information</h3>
            <div className="space-y-1 text-xs text-gray-300">
              <p>Loading Step: <span className="font-mono text-blue-400">{debugInfo.loadingStep}</span></p>
              <p>Socket: <span className="font-mono text-blue-400">{debugInfo.socketStatus}</span></p>
              <p>Auth: <span className="font-mono text-blue-400">{debugInfo.authStatus}</span></p>
              <p>Call Status: <span className="font-mono text-blue-400">{connectionStatus}</span></p>
              {debugInfo.lastError && (
                <p className="text-red-400">Error: {debugInfo.lastError}</p>
              )}
            </div>
          </div>
          
          <div className="mt-4 flex space-x-2 justify-center">
            <button
              onClick={handleForceContinue}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Force Continue
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Error screen with better navigation options
  if (error && !localStream) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-900">
        <div className="max-w-md rounded-lg bg-gray-800 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
            <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-white">Connection Error</h2>
          <p className="mb-6 text-gray-400">{error}</p>
          <div className="flex justify-center space-x-3">
            {error.includes('No appointment ID') ? (
              <button
                onClick={handleGoToAppointments}
                className="rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
              >
                View Appointments
              </button>
            ) : (
              <button
                onClick={handleRetry}
                className="rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
              >
                Retry Connection
              </button>
            )}
            <button
              onClick={() => navigate(-1)}
              className="rounded-md bg-gray-600 px-6 py-2 text-white hover:bg-gray-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Main UI - already showing local stream while appointment loads
  return (
    <div className="flex h-screen flex-col bg-gray-900">
      {/* Call header */}
      <div className="flex items-center justify-between bg-gray-800 px-4 py-3">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 overflow-hidden rounded-full bg-gray-700">
            {appointment ? (
              isDoctor ? (
                appointment?.patient?.profilePicture ? (
                  <img 
                    src={appointment.patient.profilePicture} 
                    alt={appointment.patient.name} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-blue-600 text-white">
                    {appointment?.patient?.name?.charAt(0)}
                  </div>
                )
              ) : (
                appointment?.doctor?.profilePicture ? (
                  <img 
                    src={appointment.doctor.profilePicture} 
                    alt={appointment.doctor.name} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-green-600 text-white">
                    {appointment?.doctor?.name?.charAt(0)}
                  </div>
                )
              )
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-600 text-white">
                ?
              </div>
            )}
          </div>
          <div>
            <h3 className="font-medium text-white">
              {appointment ? (
                isDoctor ? appointment?.patient?.name : appointment?.doctor?.name
              ) : (
                "Loading participant info..."
              )}
            </h3>
            <div className="flex items-center">
              {connectionStatus === 'connected' ? (
                <span className="flex items-center text-xs text-green-400">
                  <span className="mr-1 h-2 w-2 rounded-full bg-green-400"></span>
                  Connected
                </span>
              ) : connectionStatus === 'connecting' ? (
                <span className="flex items-center text-xs text-yellow-400">
                  <span className="mr-1 h-2 w-2 animate-pulse rounded-full bg-yellow-400"></span>
                  Connecting...
                </span>
              ) : (
                <span className="flex items-center text-xs text-red-400">
                  <span className="mr-1 h-2 w-2 rounded-full bg-red-400"></span>
                  Waiting for {isDoctor ? "patient" : "doctor"}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {appointment && (
            <span className="text-sm text-gray-400">
              {new Date(appointment?.date || '').toLocaleDateString()} | 
              {appointment?.startTime} - {appointment?.endTime}
            </span>
          )}
          <button 
            onClick={toggleDebugPanel}
            className="rounded bg-gray-700 px-2 py-1 text-xs text-white hover:bg-gray-600"
          >
            Debug
          </button>
        </div>
      </div>
      
      {/* Video container */}
      <div className="relative flex flex-1 items-center justify-center bg-gray-900 p-4">
        {/* Remote video (full screen) */}
        {remoteStream ? (
          <div className="h-full w-full max-w-5xl overflow-hidden rounded-lg bg-black">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="h-full w-full object-cover"
            />
          </div>
        ) : connectionStatus === 'connecting' ? (
          <div className="flex h-full w-full max-w-5xl items-center justify-center rounded-lg bg-gray-800">
            <div className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
              <h3 className="text-xl font-medium text-white">Connecting...</h3>
              <p className="mt-2 text-gray-400">Establishing secure connection</p>
            </div>
          </div>
        ) : (
          <div className="flex h-full w-full max-w-5xl items-center justify-center rounded-lg bg-gray-800">
            <div className="text-center">
              <svg
                className="mx-auto mb-4 h-16 w-16 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                ></path>
              </svg>
              {appointment ? (
                <h3 className="text-xl font-medium text-white">
                  Waiting for {isDoctor ? appointment?.patient?.name : appointment?.doctor?.name} to join...
                </h3>
              ) : (
                <h3 className="text-xl font-medium text-white">
                  Waiting for other participant to join...
                </h3>
              )}
              {error && (
                <p className="mt-4 text-red-400 text-sm">Error: {error}</p>
              )}
              
              {/* Show connection buttons in waiting state for easier testing */}
              {usersInRoom.length > 1 && (
                <div className="mt-6">
                  <button
                    onClick={handleSameDeviceConnection}
                    className="mx-auto rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    Force Connection
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Local video (picture-in-picture) - always show if available */}
        {localStream && (
          <div className="absolute bottom-8 right-8 h-40 w-56 overflow-hidden rounded-lg border-2 border-gray-700 bg-black shadow-lg">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gray-900/70 p-1 text-center">
              <span className="text-xs font-medium text-white">You ({socket?.id?.substring(0, 6) || 'local'})</span>
            </div>
          </div>
        )}
        
        {/* Debug panel (conditionally rendered) */}
        {showDebugPanel && (
          <div className="absolute left-4 top-4 w-72 rounded-lg bg-gray-800 p-4 shadow-lg">
            <h3 className="mb-2 font-semibold text-white">Debug Panel</h3>
            
            <div className="mb-2 space-y-1 text-xs text-gray-300">
              <p>Socket ID: <span className="font-mono">{socket?.id || 'Not connected'}</span></p>
              <p>Room: <span className="font-mono">{currentRoom || 'Not in room'}</span></p>
              <p>Status: <span className="font-mono">{connectionStatus}</span></p>
              <p>Users in room: <span className="font-mono">{usersInRoom.length}</span></p>
              <p>Loading: <span className="font-mono">{loading ? 'true' : 'false'}</span></p>
              <p>Appointment: <span className="font-mono">{appointment ? 'loaded' : 'not loaded'}</span></p>
              <p>Local Stream: <span className="font-mono">{localStream ? 'available' : 'not available'}</span></p>
            </div>
            
            {/* Enhanced same-device connection button */}
            {usersInRoom.length > 1 && (
              <div className="mb-3">
                <button
                  onClick={handleSameDeviceConnection}
                  className="w-full rounded-md bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Connect Same-Device
                </button>
                <p className="mt-1 text-center text-xs text-gray-400">
                  Use when testing with two browsers on same device
                </p>
              </div>
            )}
            
            <div className="mb-2">
              <h4 className="mb-1 text-xs font-medium text-white">Users in Room:</h4>
              <div className="max-h-24 overflow-y-auto rounded bg-gray-900 p-1">
                {usersInRoom.map((user, index) => (
                  <div key={index} className="mb-1 rounded bg-gray-700 p-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-gray-300 truncate">{user.userId}</span>
                      <button
                        onClick={() => handleForceConnect(user.socketId)}
                        className="ml-1 rounded bg-blue-600 px-1 text-xs text-white hover:bg-blue-700"
                      >
                        Connect
                      </button>
                    </div>
                    <div className="font-mono text-gray-400 truncate text-xxs">
                      Socket: {user.socketId}
                    </div>
                  </div>
                ))}
                {usersInRoom.length === 0 && (
                  <p className="text-center text-xs text-gray-500">No users in room</p>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-1">
              <button
                onClick={handleRetry}
                className="rounded bg-yellow-600 px-2 py-1 text-xs text-white hover:bg-yellow-700"
              >
                Retry
              </button>
              <button
                onClick={toggleDebugPanel}
                className="rounded bg-gray-600 px-2 py-1 text-xs text-white hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Call controls */}
      <div className="flex items-center justify-center space-x-4 bg-gray-800 px-4 py-4">
        <button
          onClick={toggleMicrophone}
          className={`flex h-12 w-12 items-center justify-center rounded-full ${
            isMicOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {isMicOn ? (
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
            </svg>
          ) : (
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"></path>
            </svg>
          )}
        </button>
        
        <button
          onClick={toggleVideo}
          className={`flex h-12 w-12 items-center justify-center rounded-full ${
            isVideoOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {isVideoOn ? (
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
            </svg>
          ) : (
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3l18 18"></path>
            </svg>
          )}
        </button>
        
        {connectionStatus === 'failed' && (
          <button
            onClick={handleRetry}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-600 hover:bg-yellow-700"
          >
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
          </button>
        )}
        
        <button
          onClick={handleEndCall}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 hover:bg-red-700"
        >
          <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z"></path>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default VideoCall; 