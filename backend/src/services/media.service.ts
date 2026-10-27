import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';
import { HttpError } from '../middleware/errors';

function configureCloudinary(): void {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new HttpError(503, 'MEDIA_NOT_CONFIGURED', 'Image uploads are unavailable because Cloudinary is not configured.');
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
  });
}

export async function uploadImage(buffer: Buffer, folder: string): Promise<{ secureUrl: string; publicId: string }> {
  configureCloudinary();

  try {
    return await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image' },
        (error, result) => {
          if (error || !result?.secure_url || !result.public_id) {
            reject(new HttpError(502, 'MEDIA_UPLOAD_FAILED', 'The image could not be uploaded. Check the Cloudinary configuration and try again.'));
            return;
          }
          resolve({ secureUrl: result.secure_url, publicId: result.public_id });
        }
      );
      stream.end(buffer);
    });
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(502, 'MEDIA_UPLOAD_FAILED', 'The image could not be uploaded. Check the Cloudinary configuration and try again.');
  }
}

export async function deleteImage(publicId: string): Promise<void> {
  if (!publicId) return;
  configureCloudinary();
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
  } catch {
    throw new HttpError(502, 'MEDIA_DELETE_FAILED', 'The image could not be removed from Cloudinary.');
  }
}
