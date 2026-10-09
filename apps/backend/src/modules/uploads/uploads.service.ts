import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';

/**
 * Cloudinary-backed image uploads for the business wizard (logo, cover,
 * gallery). Mirrors the web app's `/api/upload` route, but behind JWT so the
 * mobile client uploads with the owner's session.
 */
@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly configured: boolean;

  constructor(private readonly configService: ConfigService) {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    this.configured = Boolean(cloudName && apiKey && apiSecret);
    if (this.configured) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
    }
  }

  async uploadImage(
    file: Express.Multer.File | undefined,
    businessId?: string,
  ): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    if (!this.configured) {
      throw new ServiceUnavailableException(
        'Media uploads are not configured on this server',
      );
    }

    const folder = businessId
      ? `vemtap/businesses/${businessId}`
      : 'vemtap_onboarding';

    try {
      const uploaded = await new Promise<UploadApiResponse>(
        (resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder, resource_type: 'image' },
            (error, result) => {
              if (error || !result) {
                reject(
                  error instanceof Error
                    ? error
                    : new Error('Cloudinary returned no result'),
                );
                return;
              }
              resolve(result);
            },
          );
          stream.end(file.buffer);
        },
      );

      return { url: uploaded.secure_url };
    } catch (error) {
      this.logger.error(
        'Cloudinary upload failed',
        error instanceof Error ? error.stack : String(error),
      );
      throw new BadRequestException('Image upload failed');
    }
  }
}
