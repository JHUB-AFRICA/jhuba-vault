import express from 'express';
import cors from 'cors';
import routes from './routes';
import { env } from './config/env';
import { errorHandler, notFound } from './middleware/errors';

export const app = express();
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use((req, _res, next) => { if (req.path !== '/api/health') console.info(`${req.method} ${req.path}`); next(); });
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);
