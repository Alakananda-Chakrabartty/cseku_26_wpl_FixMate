import express from 'express';
import apiRouter from './api.ts';

export function createApiApp() {
  const app = express();

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
      res.setHeader('Vary', 'Origin');
    }
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // Uploaded documents are sent as data URLs, which are larger than the source file.
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'FixMate API', timestamp: new Date().toISOString() });
  });

  app.use('/api', apiRouter);
  return app;
}
