/**
 * Start web version server for desktop app
 * 
 * This module starts the complete web version server with all features,
 * but adapted for local file storage instead of S3.
 */

import * as path from 'path';
import { app } from 'electron';

// Set environment variables before importing server
process.env.NODE_ENV = 'production';
process.env.PORT = '3000';

// Use SQLite for desktop
const dbPath = path.join(app.getPath('userData'), 'database.sqlite');
process.env.DATABASE_URL = `file:${dbPath}`;

// Set storage path for local files
process.env.STORAGE_PATH = path.join(app.getPath('userData'), 'storage');

// Disable OAuth for desktop (we don't need user authentication)
process.env.SKIP_AUTH = 'true';

/**
 * Start the web server
 */
export async function startWebServer(): Promise<number> {
  try {
    console.log('[Server] Starting web version server...');
    console.log('[Server] Database:', process.env.DATABASE_URL);
    console.log('[Server] Storage:', process.env.STORAGE_PATH);
    
    // Import and start the web server
    // The server entry point is at ../server/_core/index.ts (relative to dist)
    const serverPath = path.join(__dirname, '..', 'server', '_core', 'index.js');
    
    console.log('[Server] Loading server from:', serverPath);
    
    // Dynamic import the server
    await import(serverPath);
    
    console.log('[Server] Web server started on port 3000');
    
    return 3000;
    
  } catch (error) {
    console.error('[Server] Failed to start web server:', error);
    throw error;
  }
}

/**
 * Stop the server
 */
export function stopWebServer() {
  console.log('[Server] Server will stop with app exit');
}
