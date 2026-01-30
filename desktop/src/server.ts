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
    
    const express = require('express');
    const path = require('path');
    const app = express();
    
    app.use(express.json());
    
    // Serve static files from public directory
    const publicPath = path.join(__dirname, '../public');
    console.log(`[Server] Serving static files from: ${publicPath}`);
    app.use(express.static(publicPath));
    
    // Health check endpoint
    app.get('/health', (_req: any, res: any) => {
      res.json({ status: 'ok', version: '1.0.0' });
    });
    
    // API endpoints can be added here
    app.get('/api/status', (_req: any, res: any) => {
      res.json({ 
        status: 'running',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      });
    });

    // Import database functions
    const { getAllTasks, getTask, createTask, updateTask, deleteTask } = require('./db');

    // Task API endpoints
    app.get('/api/tasks', (_req: any, res: any) => {
      try {
        const tasks = getAllTasks();
        res.json(tasks);
      } catch (error: any) {
        console.error('[API] Error getting tasks:', error);
        res.status(500).json({ error: error.message });
      }
    });

    app.get('/api/tasks/:id', (req: any, res: any) => {
      try {
        const id = parseInt(req.params.id);
        const task = getTask(id);
        if (!task) {
          return res.status(404).json({ error: 'Task not found' });
        }
        res.json(task);
      } catch (error: any) {
        console.error('[API] Error getting task:', error);
        res.status(500).json({ error: error.message });
      }
    });

    app.post('/api/tasks', (req: any, res: any) => {
      try {
        const task = createTask(req.body);
        res.json(task);
      } catch (error: any) {
        console.error('[API] Error creating task:', error);
        res.status(500).json({ error: error.message });
      }
    });

    app.patch('/api/tasks/:id', (req: any, res: any) => {
      try {
        const id = parseInt(req.params.id);
        updateTask(id, req.body);
        const task = getTask(id);
        res.json(task);
      } catch (error: any) {
        console.error('[API] Error updating task:', error);
        res.status(500).json({ error: error.message });
      }
    });

    app.delete('/api/tasks/:id', (req: any, res: any) => {
      try {
        const id = parseInt(req.params.id);
        deleteTask(id);
        res.json({ success: true });
      } catch (error: any) {
        console.error('[API] Error deleting task:', error);
        res.status(500).json({ error: error.message });
      }
    });
    
    // Start listening
    await new Promise<void>((resolve, reject) => {
      const server = app.listen(port, () => {
        console.log(`[Server] Express server started on port ${port}`);
        console.log(`[Server] Access at http://localhost:${port}`);
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
