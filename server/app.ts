import express from 'express';
import apiRouter from './api.ts';
import { getDb } from './db.ts';

export function createApiApp() {
  const app = express();

  app.use((req, res, next) => {
    if (req.headers.origin === 'http://localhost') {
      res.setHeader('Access-Control-Allow-Origin', 'http://localhost');
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

  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));
  app.get('/api/health', async (_req, res) => {
    try {
      await getDb();
      res.json({ status: 'ok', service: 'FixMate API', timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('Health check database error:', error);
      res.status(503).json({ status: 'error', service: 'FixMate API', message: 'Database unavailable.' });
    }
  });
  app.use('/api', apiRouter);

  return app;
}
