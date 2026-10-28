import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createNetServer } from 'node:net';
import { createServer as createViteServer } from 'vite';
import { createApiApp } from './server/app.ts';
import { getDb } from './server/db.ts';

async function assertPortAvailable(port: number, label: string) {
  const probe = createNetServer();

  try {
    await new Promise<void>((resolve, reject) => {
      probe.once('error', reject);
      probe.listen(port, () => {
        probe.removeAllListeners('error');
        probe.close((error) => (error ? reject(error) : resolve()));
      });
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EADDRINUSE') {
      throw new Error(
        `${label} port ${port} is already in use. FixMate may already be running. Stop the existing server or configure a different port.`
      );
    }
    throw error;
  }
}

async function startServer() {
  const app = createApiApp();
  const PORT = Number(process.env.PORT) || 3000;
  const HMR_PORT = Number(process.env.VITE_HMR_PORT) || 24678;

  await assertPortAvailable(PORT, 'FixMate');
  if (process.env.NODE_ENV !== 'production') {
    await assertPortAvailable(HMR_PORT, 'Vite HMR');
  }

  // Initialize and warm up database
  try {
    await getDb();
    console.log('FixMate Database initialized and ready.');
  } catch (err) {
    console.error('Database warmup error:', err);
    process.exit(1);
  }

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { port: HMR_PORT },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FixMate Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start FixMate:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
