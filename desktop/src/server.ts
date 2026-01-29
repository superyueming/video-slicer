import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as net from 'net';

let serverProcess: ChildProcess | null = null;

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
 * Start the Express server
 */
export async function startServer(): Promise<number> {
  // Find available port
  const port = await findAvailablePort(3000);

  return new Promise((resolve, reject) => {
    // Get the path to the server entry point
    const serverPath = path.join(__dirname, '../../server/_core/index.js');
    
    // Start server process
    serverProcess = spawn('node', [serverPath], {
      env: {
        ...process.env,
        PORT: port.toString(),
        NODE_ENV: 'production',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let serverStarted = false;

    serverProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      console.log('[Server]', output);
      
      if (output.includes('Server running') && !serverStarted) {
        serverStarted = true;
        resolve(port);
      }
    });

    serverProcess.stderr?.on('data', (data) => {
      console.error('[Server Error]', data.toString());
    });

    serverProcess.on('error', (error) => {
      console.error('[Server] Failed to start:', error);
      reject(error);
    });

    serverProcess.on('exit', (code) => {
      console.log(`[Server] Exited with code ${code}`);
      serverProcess = null;
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!serverStarted) {
        reject(new Error('Server start timeout'));
      }
    }, 30000);
  });
}

/**
 * Stop the server
 */
export function stopServer() {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
}
