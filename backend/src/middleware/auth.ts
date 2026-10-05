import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { env } from '../config/env';
import { HttpError } from './errors';
interface Claims { userId: string; role: Role; }
export function requireAuth(req: Request, _res: Response, next: NextFunction): void { const header = req.header('authorization'); if (!header?.startsWith('Bearer ')) return next(new HttpError(401, 'UNAUTHENTICATED', 'Authentication is required')); try { const claims = jwt.verify(header.slice(7), env.JWT_SECRET) as Claims; req.auth = { userId: claims.userId, role: claims.role }; next(); } catch { next(new HttpError(401, 'INVALID_TOKEN', 'Invalid or expired token')); } }
export function requireRole(role: Role) { return (req: Request, _res: Response, next: NextFunction): void => { if (req.auth?.role !== role) return next(new HttpError(403, 'FORBIDDEN', 'You do not have permission for this resource')); next(); }; }
