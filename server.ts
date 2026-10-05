import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import apiRouter from './server/api.ts';
import { getDb } from './server/db.ts';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const HMR_PORT = Number(process.env.VITE_HMR_PORT) || 24678;

  // Uploaded documents are sent as data URLs, which are larger than the source file.
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Initialize and warm up database
  try {
    await getDb();
    console.log('FixMate Database initialized and ready.');
  } catch (err) {
    console.error('Database warmup error:', err);
    process.exit(1);
  }

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'FixMate API', timestamp: new Date().toISOString() });
  });

  // Mount API routes
  app.use('/api', apiRouter);

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

startServer();
