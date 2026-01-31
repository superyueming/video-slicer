/**
 * Server launcher for desktop app
 * 
 * Starts the complete web version server in desktop mode
 */

import * as path from 'path';
import * as fs from 'fs';

/**
 * Start the web version server in desktop mode
 * 
 * This launches the complete web application server with:
 * - DESKTOP_MODE=true for local storage and auto-login
 * - NODE_ENV=production to serve built files
 * - All web features available locally
 */
export async function startServer(): Promise<number> {
  try {
    console.log('[Server] Starting web version server in desktop mode...');
    
    // Set environment variables for desktop mode
    process.env.DESKTOP_MODE = 'true';
    process.env.NODE_ENV = 'production';
    
    // Set local storage directory
    const appDataPath = path.join(process.env.APPDATA || process.env.HOME || '', 'video-slicer-desktop');
    const storageDir = path.join(appDataPath, 'storage');
    process.env.LOCAL_STORAGE_DIR = storageDir;
    
    // Ensure storage directory exists
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
    
    console.log('[Server] Storage directory:', storageDir);
    console.log('[Server] Desktop mode enabled');
    
    // Import and start the web server
    // The web server is bundled in web-dist/index.js
    const webServerPath = path.join(__dirname, '../web-dist/index.js');
    
    if (!fs.existsSync(webServerPath)) {
      throw new Error(`Web server not found at: ${webServerPath}`);
    }
    
    console.log('[Server] Loading web server from:', webServerPath);
    
    // Import the web server module
    // This will execute the server startup code
    await import(webServerPath);
    
    // The web server will find an available port automatically
    // We'll return the default port for now
    const port = parseInt(process.env.PORT || '3000');
    
    console.log('[Server] Web server started successfully');
    
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
  // The server will stop when the app exits
  console.log('[Server] Server will stop with app exit');
}
