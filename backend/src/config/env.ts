import 'dotenv/config';
import { z } from 'zod';
const schema = z.object({ DATABASE_URL: z.string().min(1), JWT_SECRET: z.string().min(16), JWT_EXPIRES_IN: z.string().default('1d'), CLIENT_URL: z.string().default('http://localhost:4300'), PORT: z.coerce.number().default(3000), CLOUDINARY_CLOUD_NAME: z.string().optional(), CLOUDINARY_API_KEY: z.string().optional(), CLOUDINARY_API_SECRET: z.string().optional(), MAIL_HOST: z.string().optional(), MAIL_PORT: z.coerce.number().default(587), MAIL_USER: z.string().optional(), MAIL_PASSWORD: z.string().optional(), MAIL_FROM: z.string().default('JHUB Africa Vault <noreply@example.com>') });
export const env = schema.parse(process.env);
