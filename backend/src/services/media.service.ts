import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';
cloudinary.config({ cloud_name: env.CLOUDINARY_CLOUD_NAME, api_key: env.CLOUDINARY_API_KEY, api_secret: env.CLOUDINARY_API_SECRET });
export async function uploadImage(buffer: Buffer, folder: string): Promise<{ secureUrl: string; publicId: string }> { if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) throw new Error('Cloudinary is not configured'); return new Promise((resolve, reject) => { const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'image' }, (error, result) => error || !result ? reject(error ?? new Error('Upload failed')) : resolve({ secureUrl: result.secure_url, publicId: result.public_id })); stream.end(buffer); }); }
export async function deleteImage(publicId: string): Promise<void> { if (!publicId) return; await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true }); }
