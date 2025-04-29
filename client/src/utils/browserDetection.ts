/**
 * Browser detection utility functions
 * Helps with Safari and other browser-specific workarounds
 */

export const browserInfo = {
  get isSafari() {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  },
  
  get isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  },
  
  get isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },
  
  get isFirefox() {
    return navigator.userAgent.indexOf('Firefox') !== -1;
  },
  
  get isChrome() {
    return navigator.userAgent.indexOf('Chrome') !== -1 && navigator.userAgent.indexOf('Edge') === -1;
  },
  
  /**
   * Get a description of the current browser
   */
  getDescription() {
    if (this.isSafari) return this.isIOS ? 'iOS Safari' : 'Safari';
    if (this.isFirefox) return 'Firefox';
    if (this.isChrome) return 'Chrome';
    return 'Unknown Browser';
  }
};

/**
 * Check if the WebRTC implementation is complete/reliable
 */
export const hasReliableWebRTC = () => {
  // Check if browser supports WebRTC API
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return false;
  }
  
  // Safari generally has issues with WebRTC, especially older versions
  if (browserInfo.isSafari) {
    // Check for newer Safari that has better WebRTC support
    const match = navigator.userAgent.match(/Version\/(\d+)/);
    if (match && match[1]) {
      const version = parseInt(match[1], 10);
      return version >= 15; // Safari 15+ has better WebRTC support
    }
    return false; // Older Safari versions have WebRTC issues
  }
  
  return true; // Chrome, Firefox, etc. have good WebRTC support
};

/**
 * Get WebRTC constraints optimized for the current browser
 */
export const getOptimizedConstraints = () => {
  const constraints: MediaStreamConstraints = {
    audio: true,
    video: true
  };
  
  // On Safari, we need to be more specific
  if (browserInfo.isSafari) {
    constraints.video = {
      width: { ideal: 640 },
      height: { ideal: 480 },
      facingMode: 'user'
    };
  }
  
  // On mobile, use lower resolution to save bandwidth
  if (browserInfo.isMobile) {
    constraints.video = {
      width: { ideal: 480 },
      height: { ideal: 360 },
      facingMode: 'user'
    };
  }
  
  return constraints;
};

export default browserInfo; 