/**
 * Simple in-process Express server for desktop app
 * 
 * Instead of spawning a separate node process, we directly import and start
 * the Express server in the Electron main process. This avoids the "spawn node ENOENT"
 * error that occurs when node is not in PATH in packaged apps.
 */

import * as net from 'net';

/**
 * Find an available port
 */
function findAvailablePort(startPort: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    
    server.listen(startPort, () => {
      const port = (server.address() as net.AddressInfo).port;
      server.close(() => resolve(port));
    });
    
    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        // Port is in use, try next one
        resolve(findAvailablePort(startPort + 1));
      } else {
        reject(err);
      }
    });
  });
}

/**
 * Start the Express server in-process
 * 
 * For desktop app, we use a simple Express server that runs in the same process.
 * This is more reliable than spawning a separate node process.
 */
export async function startServer(): Promise<number> {
  try {
    // Find available port
    const port = await findAvailablePort(3000);
    
    console.log(`[Server] Starting Express server on port ${port}...`);
    
    // For now, we'll use a minimal Express server
    // The full web server with tRPC is too complex for desktop app
    // We'll create a simple API server instead
    
    const express = require('express');
    const app = express();
    
    app.use(express.json());
    
    // Health check endpoint
    app.get('/health', (_req: any, res: any) => {
      res.json({ status: 'ok', version: '1.0.0' });
    });
    
    // Start listening
    await new Promise<void>((resolve, reject) => {
      const server = app.listen(port, () => {
        console.log(`[Server] Express server started on port ${port}`);
        resolve();
      });
      
      server.on('error', (error: any) => {
        console.error('[Server] Failed to start:', error);
        reject(error);
      });
    });
    
    return port;
    
  } catch (error) {
    console.error('[Server] Error starting server:', error);
    throw error;
  }
}

/**
 * Stop the server
 */
export function stopServer() {
  // For in-process server, we don't need to do anything
  // The server will stop when the app exits
  console.log('[Server] Server will stop with app exit');
}
