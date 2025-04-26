// Polyfill for browser compatibility
if (typeof window !== 'undefined') {
  (window as any).global = window;
  (window as any).process = { env: {} };
}

// Now that we have the polyfill, import simple-peer
import Peer from 'simple-peer';

// Interface for creating a peer connection
export interface PeerOptions {
  initiator: boolean;
  stream?: MediaStream;
  config?: RTCConfiguration;
}

// Create a new peer connection
export const createPeerConnection = (options: PeerOptions): any => {
  return new Peer({
    initiator: options.initiator,
    trickle: true,
    stream: options.stream,
    config: options.config || {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
      ]
    },
    objectMode: true
  });
};

export default Peer; 