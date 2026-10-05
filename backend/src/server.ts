import { app } from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { markOverdueRequests } from './services/overdue.service';

const server = app.listen(env.PORT, () => console.info(`JHUB Africa Vault API listening on http://localhost:${env.PORT}/api`));
const overdueTimer = setInterval(() => { void markOverdueRequests().catch(error => console.error('Overdue scan failed', error)); }, 60 * 60 * 1000);
function shutdown(): void { clearInterval(overdueTimer); server.close(() => { void prisma.$disconnect(); }); }
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);
