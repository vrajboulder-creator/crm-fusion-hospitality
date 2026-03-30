/**
 * Scanner route — spawns the local OCR scanner script as a child process.
 */

import type { FastifyInstance } from 'fastify';
import { spawn } from 'child_process';
import path from 'path';

export async function scannerRoutes(app: FastifyInstance): Promise<void> {
  app.post('/start', async (req, reply) => {
    const body = req.body as { folderPath?: string };
    const folderPath = body?.folderPath?.trim();

    if (!folderPath) {
      return reply.code(400).send({ success: false, message: 'folderPath is required' });
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

    return reply.code(202).send({
      success: true,
      message: 'Scan started',
      pid: child.pid,
    });
  });
}
