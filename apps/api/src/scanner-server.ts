/**
 * Lightweight standalone scanner server for mock mode.
 * Runs independently of the full API server — only serves /api/v1/scanner/start.
 * Use this during development when VITE_MOCK=true.
 */

import http from 'http';
import { spawn } from 'child_process';
import path from 'path';

const PORT = 3001;

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', ts: new Date().toISOString() }));
    return;
  }

  // Scanner start endpoint
  if (req.url === '/api/v1/scanner/start' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const { folderPath } = JSON.parse(body);
        if (!folderPath?.trim()) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'folderPath is required' }));
          return;
        }

        const projectRoot = path.resolve(process.cwd());
        const scriptPath = path.join(projectRoot, 'scripts', 'scanWithOCR-local.ts');

        const child = spawn('npx', ['tsx', scriptPath, folderPath], {
          cwd: projectRoot,
          detached: true,
          stdio: 'ignore',
          shell: true,
        });

        child.unref();

        res.writeHead(202, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Scan started',
          pid: child.pid,
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Invalid request' }));
      }
    });
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🔍 Scanner server listening on port ${PORT}`);
  console.log(`   GET  /health`);
  console.log(`   POST /api/v1/scanner/start`);
});
