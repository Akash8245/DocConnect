import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'window', // Polyfill for 'global' variable used by simple-peer
  },
  server: {
    port: 5173,
    host: '0.0.0.0', // Allow access from local network devices
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        timeout: 60000, // Increase timeout to 60 seconds
        configure: (proxy, options) => {
          // Log proxy configuration on startup
          console.log('Configuring proxy for /api -> http://localhost:5001');
          
          proxy.on('error', (err, req, res) => {
            console.error('Proxy error:', err);
            
            // Try to send an error response if headers haven't been sent
            if (!res.headersSent) {
              res.writeHead(500, {
                'Content-Type': 'application/json',
              });
              res.end(JSON.stringify({ 
                error: 'Proxy error',
                message: 'The API server is unavailable. Please try again later.'
              }));
            }
          });
          
          proxy.on('proxyReq', (proxyReq, req, res) => {
            const { method, url } = req;
            console.log(`[PROXY] Request: ${method} ${url}`);
            
            // Log request headers for debugging authentication issues
            if (url.includes('/auth') || url.includes('/appointments')) {
              const authHeader = req.headers.authorization || 'No Authorization header';
              console.log(`[PROXY] Auth header: ${authHeader.substring(0, 20)}...`);
            }
          });
          
          proxy.on('proxyRes', (proxyRes, req, res) => {
            const { method, url } = req;
            const { statusCode } = proxyRes;
            console.log(`[PROXY] Response: ${statusCode} for ${method} ${url}`);
            
            // Log detailed information for error responses
            if (statusCode >= 400) {
              let responseBody = '';
              proxyRes.on('data', (chunk) => {
                responseBody += chunk;
              });
              
              proxyRes.on('end', () => {
                try {
                  const parsedBody = JSON.parse(responseBody);
                  console.log(`[PROXY] Error response body:`, parsedBody);
                } catch (e) {
                  console.log(`[PROXY] Error response (not JSON):`, responseBody);
                }
              });
            }
          });
        }
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  }
})
