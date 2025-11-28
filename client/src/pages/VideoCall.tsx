import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Helmet } from 'react-helmet-async';

const VideoCall = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // 100ms.live meeting URL
  const meetingUrl = 'https://m-videoconf-010.app.100ms.live/meeting/bsp-gssd-tmi';

  return (
    <div className="flex h-screen flex-col bg-gray-900">
      <Helmet>
        <title>Video Consultation - DocConnect</title>
      </Helmet>

      {/* Header */}
      <div className="flex items-center justify-between bg-gray-800 px-4 py-3">
        <div className="flex items-center space-x-3">
          <h2 className="text-xl font-semibold text-white">Video Consultation</h2>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          End Call
        </button>
      </div>

      {/* Video iframe */}
      <div className="flex-1">
        <iframe
          src={meetingUrl}
          className="h-full w-full"
          allow="camera; microphone; fullscreen; speaker; display-capture"
          allowFullScreen
        />
      </div>
    </div>
  );
};

export default VideoCall; 