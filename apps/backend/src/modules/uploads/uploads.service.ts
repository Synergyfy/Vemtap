import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';

/**
 * The upload callback's error is frequently a plain `{ message, http_code }`
 * object rather than an `Error` instance. Flattened for the log so the real
 * Cloudinary reason (e.g. "missing permissions") survives instead of being
 * replaced by a generic string.
 */
function describeUploadError(error: unknown): string {
  if (error instanceof Error) {
    return error.stack ?? error.message;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

/** Cloudinary's transport/permission status, if the error carries one. */
function uploadErrorHttpCode(error: unknown): number | undefined {
  if (error && typeof error === 'object' && 'http_code' in error) {
    const code = (error as { http_code?: unknown }).http_code;
    return typeof code === 'number' ? code : undefined;
  }
  return undefined;
}

/**
 * Cloudinary-backed image uploads for the business wizard (logo, cover,
 * gallery). Mirrors the web app's `/api/upload` route, but behind JWT so the
 * mobile client uploads with the owner's session.
 *
 * `folderOverride` lets a non-business caller (chat media) keep its uploads
 * out of the business and onboarding folders.
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
    folderOverride?: string,
  ): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    if (!this.configured) {
      throw new ServiceUnavailableException(
        'Media uploads are not configured on this server',
      );
    }

    const folder =
      folderOverride ??
      (businessId ? `vemtap/businesses/${businessId}` : 'vemtap_onboarding');

    try {
      const uploaded = await new Promise<UploadApiResponse>(
        (resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder, resource_type: 'image' },
            (error, result) => {
              if (error || !result) {
                // Keep Cloudinary's error intact — replacing non-Error values
                // with a generic message is what hid the restricted-key
                // "missing permissions" outage behind "returned no result".
                reject(error ?? new Error('Cloudinary returned no result'));
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
        describeUploadError(error),
      );

      const httpCode = uploadErrorHttpCode(error);
      if (httpCode === 401 || httpCode === 403) {
        // Credentials or role permissions, not the file: retrying the same
        // request can never succeed, so say what an operator must fix.
        throw new ServiceUnavailableException(
          'Media storage rejected the upload credentials or permissions',
        );
      }
      throw new BadRequestException('Image upload failed');
    }
  }
}
