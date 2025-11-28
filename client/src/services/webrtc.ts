// Polyfill for browser compatibility
if (typeof window !== 'undefined') {
  (window as any).global = window;
  (window as any).process = { env: {} };
}

// Now that we have the polyfill, import simple-peer
import Peer, { Options } from 'simple-peer';

// Interface for creating a peer connection
export interface PeerOptions {
  initiator: boolean;
  stream?: MediaStream;
  config?: RTCConfiguration;
}

/**
 * Configuration for ICE servers (STUN/TURN)
 */
export const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ],
};

/**
 * Helper to create peer connection options with default configuration
 */
export const createPeerOptions = (options: Partial<Options>): Options => {
  return {
    config: iceServers,
    // Set reasonable defaults
    trickle: true, // Enable ICE trickle for faster connection
    ...options,
  };
};

// Create a new peer connection
export const createPeerConnection = (options: PeerOptions): any => {
  return new Peer({
    initiator: options.initiator,
    trickle: true, // Enable ICE trickle for faster connection
    stream: options.stream,
    config: options.config || iceServers,
    reconnectTimer: 1000,
    iceTransportPolicy: 'all',
    sdpTransform: (sdp) => {
      // Add high bitrate for better video quality (optional)
      return sdp.replace('b=AS:30', 'b=AS:1000');
    },
  });
};

export default Peer; 