import express from 'express';
import { spawn, ChildProcess } from 'child_process';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const PYTHON_PORT = 8000;
let pythonProcess: ChildProcess | null = null;

function startPythonFastAPI(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('[CertiFlow] Spawning Python FastAPI backend on port ' + PYTHON_PORT + '...');
    const backendDir = path.resolve(__dirname, 'backend');

    pythonProcess = spawn(
      'python3',
      ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', String(PYTHON_PORT)],
      {
        cwd: backendDir,
        env: {
          ...process.env,
          PYTHONUNBUFFERED: '1',
          PYTHONPATH: backendDir,
        },
      }
    );

    pythonProcess.stdout?.on('data', (data) => {
      const msg = data.toString();
      // Print backend logs
      if (process.env.DEBUG || msg.includes('Uvicorn running')) {
        console.log(`[Python] ${msg.trim()}`);
      }
    });

    pythonProcess.stderr?.on('data', (data) => {
      const msg = data.toString();
      if (msg.includes('ERROR') || msg.includes('Uvicorn running')) {
        console.error(`[Python] ${msg.trim()}`);
      }
    });

    pythonProcess.on('error', (err) => {
      console.error('[CertiFlow] Failed to start Python process:', err);
      reject(err);
    });

    pythonProcess.on('exit', (code, signal) => {
      console.log(`[CertiFlow] Python process exited with code ${code}, signal ${signal}`);
    });

    // Poll until FastAPI is responding
    let attempts = 0;
    const maxAttempts = 30;
    const interval = setInterval(() => {
      attempts++;
      const req = http.get(`http://127.0.0.1:${PYTHON_PORT}/api/health`, (res) => {
        if (res.statusCode === 200) {
          clearInterval(interval);
          console.log('[CertiFlow] Python FastAPI backend is healthy and ready!');
          resolve();
        }
      });
      req.on('error', () => {
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          console.warn('[CertiFlow] Python backend took longer to respond, continuing anyway...');
          resolve();
        }
      });
      req.end();
    }, 300);
  });
}

async function startServer() {
  await startPythonFastAPI();

  const app = express();

  // Proxy /api/* requests directly to Python FastAPI backend
  app.use('/api', (req, res) => {
    const targetUrl = new URL(req.originalUrl, `http://127.0.0.1:${PYTHON_PORT}`);
    
    const proxyReq = http.request(
      targetUrl,
      {
        method: req.method,
        headers: {
          ...req.headers,
          host: `127.0.0.1:${PYTHON_PORT}`,
        },
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
        proxyRes.pipe(res);
      }
    );

    proxyReq.on('error', (err) => {
      console.error('[Proxy Error]:', err.message);
      if (!res.headersSent) {
        res.status(502).json({
          error: 'Backend gateway error',
          message: 'Could not connect to FastAPI backend service. Retrying initialization...',
        });
      }
    });

    req.pipe(proxyReq);
  });

  // Setup frontend: Vite dev middleware in development, static files in production
  const isProduction = process.env.NODE_ENV === 'production';
  const distPath = path.resolve(__dirname, 'dist');

  if (!isProduction || !fs.existsSync(distPath)) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CertiFlow] Unified Server running at http://0.0.0.0:${PORT}`);
  });

  const cleanup = () => {
    console.log('[CertiFlow] Shutting down processes...');
    if (pythonProcess) {
      pythonProcess.kill('SIGTERM');
    }
    server.close();
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

startServer().catch((err) => {
  console.error('[CertiFlow] Server failed to start:', err);
  process.exit(1);
});
