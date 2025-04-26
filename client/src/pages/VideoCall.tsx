import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';
import { 
  MicrophoneIcon, 
  PhoneIcon, 
  VideoCameraIcon,
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/solid';
import { 
  MicrophoneIcon as MicrophoneIconOutline, 
  VideoCameraIcon as VideoCameraIconOutline,
} from '@heroicons/react/24/outline';

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

const VideoCall = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMediaPermissions, setHasMediaPermissions] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'waiting' | 'error'>('connecting');
  const [retryCount, setRetryCount] = useState(0);
  
  // Socket context for WebRTC
  const { 
    socket,
    localStream, 
    remoteStreams, 
    joinRoom, 
    leaveRoom, 
    startCall, 
    endCall: socketEndCall,
    isCallActive,
    users: roomUsers
  } = useSocket();
  
  // Video call states
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  // Video refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement | null>>(new Map());
  
  // Check for media permissions first
  useEffect(() => {
    const checkMediaPermissions = async () => {
      try {
        // Just check if we can access media devices
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        // Stop the streams immediately after checking permissions
        stream.getTracks().forEach(track => track.stop());
        
        setHasMediaPermissions(true);
      } catch (err) {
        console.error('Media permissions denied:', err);
        setHasMediaPermissions(false);
        setError('Camera and microphone access is required for video calls. Please allow access and reload the page.');
        setConnectionStatus('error');
      }
    };
    
    checkMediaPermissions();
  }, []);
  
  // Fetch appointment data
  const fetchAppointmentData = useCallback(async () => {
    if (!token || !appointmentId) {
      setError('Missing authentication or appointment ID.');
      setLoading(false);
      setConnectionStatus('error');
      return;
    }
    
    try {
      setLoading(true);
      
      // Use the correct API endpoint and include authorization header
      const response = await axios.get(`/api/video-call/${appointmentId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setAppointment(response.data);
      return response.data;
    } catch (err: any) {
      console.error('Error fetching appointment data:', err);
      const errorMsg = err.response?.data?.message || 'Failed to load appointment details. Please try again.';
      setError(errorMsg);
      setConnectionStatus('error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [appointmentId, token]);
  
  // Initialize call
  const initializeCall = useCallback(async () => {
    if (!hasMediaPermissions || !appointmentId) return;
    
    try {
      setConnectionStatus('connecting');
      
      // Fetch appointment data first
      const appointmentData = await fetchAppointmentData();
      if (!appointmentData) return;
      
      // Join the room using appointmentId
      joinRoom(appointmentId);
      
      // Start the call
      await startCall();
      
      // Update connection status based on whether anyone else is in the room
      if (roomUsers.length <= 1) {
        setConnectionStatus('waiting');
      } else {
        setConnectionStatus('connected');
      }
    } catch (callErr) {
      console.error('Error starting video call:', callErr);
      setError('Failed to start video call. Please check your camera and microphone permissions.');
      setConnectionStatus('error');
    }
  }, [appointmentId, fetchAppointmentData, hasMediaPermissions, joinRoom, roomUsers.length, startCall]);
  
  // Initialize call when media permissions are granted
  useEffect(() => {
    if (hasMediaPermissions && token && appointmentId) {
      initializeCall();
    }
    
    // Cleanup function
    return () => {
      leaveRoom();
      socketEndCall();
    };
  }, [appointmentId, hasMediaPermissions, initializeCall, leaveRoom, socketEndCall, token]);
  
  // Update connection status based on roomUsers changes
  useEffect(() => {
    if (isCallActive) {
      if (remoteStreams.size > 0) {
        setConnectionStatus('connected');
      } else if (roomUsers.length > 1) {
        // Users in room but no stream yet - still connecting
        setConnectionStatus('connecting');
      } else {
        setConnectionStatus('waiting');
      }
    }
  }, [roomUsers, isCallActive, remoteStreams.size]);
  
  // Listen for socket connection status
  useEffect(() => {
    if (!socket) {
      setConnectionStatus('error');
      setError('Failed to connect to video service. Please try again.');
    }
  }, [socket]);

  // Set local stream to video element
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Toggle microphone
  const toggleMicrophone = useCallback(() => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        const enabled = !audioTracks[0].enabled;
        audioTracks[0].enabled = enabled;
        setIsMuted(!enabled);
      }
    }
  }, [localStream]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        const enabled = !videoTracks[0].enabled;
        videoTracks[0].enabled = enabled;
        setIsVideoOff(!enabled);
      }
    }
  }, [localStream]);

  // Handle retry
  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    setError(null);
    
    // Cleanup previous call
    leaveRoom();
    socketEndCall();
    
    // Small delay before retrying
    setTimeout(() => {
      initializeCall();
    }, 1000);
  }, [initializeCall, leaveRoom, socketEndCall]);

  // End call
  const handleEndCall = useCallback(() => {
    socketEndCall();
    leaveRoom();
    
    // Navigate back based on user role
    if (user) {
      navigate(`/${user.role}/appointments`);
    } else {
      navigate('/login');
    }
  }, [leaveRoom, navigate, socketEndCall, user]);

  // Get the name of the other participant
  const getOtherParticipantName = useCallback(() => {
    if (!appointment || !user) return 'the other participant';
    return user.role === 'doctor' ? appointment.patient.name : appointment.doctor.name;
  }, [appointment, user]);

  // If media permissions are denied
  if (!hasMediaPermissions && error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-secondary-900 text-white p-8">
        <div className="text-xl font-semibold mb-4 text-center">
          Camera and Microphone Access Required
        </div>
        <p className="text-center mb-6 max-w-lg">
          {error}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-secondary-900">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-secondary-900 text-white p-4">
        <div className="text-xl font-semibold mb-4 text-center max-w-lg">
          {error}
        </div>
        <div className="flex space-x-4">
          {retryCount < 3 && (
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Retry Connection
            </button>
          )}
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-secondary-900 text-white p-4">
        <div className="text-xl font-semibold mb-4">
          Appointment not found
        </div>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  const otherParticipant = user?.role === 'doctor' ? appointment.patient : appointment.doctor;

  return (
    <div className="h-screen bg-secondary-900 flex flex-col">
      {/* Call header */}
      <div className="bg-secondary-800 text-white p-4 flex justify-between items-center">
        <div className="flex items-center">
          <img
            src={otherParticipant?.profilePicture || 'https://via.placeholder.com/40'}
            alt={otherParticipant?.name}
            className="w-10 h-10 rounded-full object-cover mr-3"
          />
          <div>
            <h2 className="font-semibold">{otherParticipant?.name}</h2>
            <p className="text-sm text-secondary-300">
              {appointment?.date.split('T')[0].split('-').reverse().join('/')} • {appointment?.startTime} - {appointment?.endTime}
            </p>
          </div>
        </div>
        <div className="flex items-center">
          {connectionStatus === 'waiting' && (
            <span className="text-yellow-400 text-sm mr-4">Waiting for {otherParticipant?.name}...</span>
          )}
          {connectionStatus === 'connecting' && (
            <span className="text-blue-400 text-sm mr-4">Connecting...</span>
          )}
          {connectionStatus === 'connected' && (
            <span className="text-green-400 text-sm mr-4">Connected</span>
          )}
          <button 
            onClick={handleEndCall}
            className="text-red-500 hover:text-red-400"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Video container */}
      <div className="flex-1 relative overflow-hidden">
        {/* Remote videos (other participants) */}
        <div className="w-full h-full grid grid-cols-1 gap-2">
          {Array.from(remoteStreams).map(([userId, stream]) => (
            <div key={userId} className="w-full h-full">
              <video
                ref={(el) => {
                  if (el) {
                    el.srcObject = stream;
                    el.play().catch(e => console.error("Error playing remote video:", e));
                    remoteVideoRefs.current.set(userId, el);
                  }
                }}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
          ))}
          
          {remoteStreams.size === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-white">
              {connectionStatus === 'waiting' && (
                <>
                  <div className="w-24 h-24 mb-6 rounded-full bg-secondary-700 flex items-center justify-center">
                    <img 
                      src={otherParticipant?.profilePicture || 'https://via.placeholder.com/100'} 
                      alt={otherParticipant?.name}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  </div>
                  <p className="text-xl mb-2">Waiting for {otherParticipant?.name} to join...</p>
                  <p className="text-sm text-secondary-400">The call will start automatically when they join</p>
                </>
              )}
              
              {connectionStatus === 'connecting' && (
                <>
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
                  <p>Establishing video connection...</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Local video (self) */}
        <div className="absolute bottom-5 right-5 w-48 h-36 bg-black rounded-lg overflow-hidden border-2 border-white shadow-lg">
          {localStream ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted // Always mute local video to prevent echo
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-secondary-800">
              <p className="text-sm text-white">Camera loading...</p>
            </div>
          )}
        </div>
      </div>

      {/* Call controls */}
      <div className="bg-secondary-800 p-4 flex justify-center">
        <div className="flex space-x-4">
          <button
            onClick={toggleMicrophone}
            className={`p-3 rounded-full ${
              isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-secondary-700 hover:bg-secondary-600'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
            disabled={!localStream}
          >
            {isMuted ? (
              <MicrophoneIconOutline className="h-6 w-6 text-white" />
            ) : (
              <MicrophoneIcon className="h-6 w-6 text-white" />
            )}
          </button>
          
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full ${
              isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-secondary-700 hover:bg-secondary-600'
            }`}
            title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
            disabled={!localStream}
          >
            {isVideoOff ? (
              <VideoCameraIconOutline className="h-6 w-6 text-white" />
            ) : (
              <VideoCameraIcon className="h-6 w-6 text-white" />
            )}
          </button>
          
          {connectionStatus === 'connecting' && retryCount < 3 && (
            <button
              onClick={handleRetry}
              className="p-3 bg-blue-500 hover:bg-blue-600 rounded-full"
              title="Retry Connection"
            >
              <ArrowPathIcon className="h-6 w-6 text-white" />
            </button>
          )}
          
          <button
            onClick={handleEndCall}
            className="p-3 bg-red-500 hover:bg-red-600 rounded-full"
            title="End Call"
          >
            <PhoneIcon className="h-6 w-6 text-white transform rotate-135" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCall; 