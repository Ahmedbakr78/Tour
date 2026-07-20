import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';

import app from '../server/src/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(__dirname, '../../client/dist/tourmate-client');

// Serve the Angular build (SPA) for every non-API route.
app.use(express.static(dist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/api-docs')) return next();
  res.sendFile(path.join(dist, 'index.html'));
});

export default app;
