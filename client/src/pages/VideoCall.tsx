import React from 'react';

const VideoCall: React.FC = () => {
  return (
    <div className="video-call-container" style={{ width: '100%', height: '100vh' }}>
      <iframe 
        src="https://m-videoconf-010.app.100ms.live/meeting/bsp-gssd-tmi"
        allow="camera; microphone; fullscreen; display-capture; autoplay"
        style={{ 
          width: '100%', 
          height: '100%', 
          border: 'none',
          overflow: 'hidden'
        }}
        title="Video Conference"
      />
    </div>
  );
};

export default VideoCall;
