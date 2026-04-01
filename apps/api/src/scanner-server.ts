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

  // Resolve folder name to full path
  if (req.url === '/api/v1/scanner/resolve-folder' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const { folderName } = JSON.parse(body);
        if (!folderName) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'folderName is required' }));
          return;
        }

        const os = require('os');
        const fs = require('fs');
        const homeDir = os.homedir();
        const candidates = [
          path.join(homeDir, 'Downloads', folderName),
          path.join(homeDir, 'Desktop', folderName),
          path.join(homeDir, 'Documents', folderName),
          path.join(homeDir, 'OneDrive', folderName),
          path.join(process.cwd(), folderName),
        ];

        for (const c of candidates) {
          if (fs.existsSync(c)) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, folderPath: c }));
            return;
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, folderPath: null, message: 'Not found' }));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Invalid request' }));
      }
    });
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

        const tsxCli = require.resolve('tsx/cli');
        const child = spawn(process.execPath, [tsxCli, scriptPath, folderPath], {
          cwd: projectRoot,
          detached: true,
          stdio: 'ignore',
          windowsHide: true,
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

  // Ingest endpoint — spawns the ingest script
  if (req.url === '/api/v1/scanner/ingest' && req.method === 'POST') {
    const projectRoot = path.resolve(process.cwd());
    const scriptPath = path.join(projectRoot, 'scripts', 'ingest-to-supabase.ts');

    const child = spawn('npx', ['tsx', scriptPath], {
      cwd: projectRoot,
      stdio: 'pipe',
      shell: true,
    });

    let output = '';
    child.stdout?.on('data', (d) => { output += d.toString(); });
    child.stderr?.on('data', (d) => { output += d.toString(); });

    child.on('close', (code) => {
      res.writeHead(code === 0 ? 200 : 500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: code === 0,
        message: code === 0 ? 'Ingestion complete' : 'Ingestion failed',
        output: output.trim(),
      }));
    });

    child.on('error', () => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Failed to start ingestion script' }));
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
