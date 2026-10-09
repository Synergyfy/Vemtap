import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { UploadsService } from './uploads.service';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: { upload_stream: jest.fn() },
  },
}));

const mockedCloudinary = cloudinary as unknown as {
  config: jest.Mock;
  uploader: { upload_stream: jest.Mock };
};

const configuredValues: Record<string, string> = {
  CLOUDINARY_CLOUD_NAME: 'vemtap',
  CLOUDINARY_API_KEY: 'key',
  CLOUDINARY_API_SECRET: 'secret',
};

const configService = (values: Record<string, string | undefined>) =>
  ({
    get: (key: string) => values[key],
  }) as unknown as ConfigService;

const file = (overrides: Partial<Express.Multer.File> = {}) =>
  ({
    buffer: Buffer.from('image-bytes'),
    mimetype: 'image/png',
    originalname: 'logo.png',
    ...overrides,
  }) as Express.Multer.File;

/** Makes upload_stream invoke its callback with the given result/error. */
function mockUploadStream(result: unknown, error: unknown = null) {
  mockedCloudinary.uploader.upload_stream.mockImplementation(
    (
      _options: unknown,
      callback: (error: unknown, result: unknown) => void,
    ) => {
      callback(error, result);
      return { end: jest.fn() };
    },
  );
}

describe('UploadsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects a missing file', async () => {
    const service = new UploadsService(configService(configuredValues));

    await expect(service.uploadImage(undefined)).rejects.toThrow(
      BadRequestException,
    );
    expect(mockedCloudinary.uploader.upload_stream).not.toHaveBeenCalled();
  });

  it('fails clearly when Cloudinary env keys are absent', async () => {
    const service = new UploadsService(configService({}));

    await expect(service.uploadImage(file())).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('uploads to a per-business folder and returns the secure URL', async () => {
    mockUploadStream({ secure_url: 'https://cdn.vemtap.com/logo.png' });
    const service = new UploadsService(configService(configuredValues));

    const result = await service.uploadImage(file(), 'biz-1');

    expect(result).toEqual({ url: 'https://cdn.vemtap.com/logo.png' });
    expect(mockedCloudinary.uploader.upload_stream).toHaveBeenCalledWith(
      expect.objectContaining({ folder: 'vemtap/businesses/biz-1' }),
      expect.any(Function),
    );
  });

  it('falls back to the onboarding folder without a business id', async () => {
    mockUploadStream({ secure_url: 'https://cdn.vemtap.com/logo.png' });
    const service = new UploadsService(configService(configuredValues));

    await service.uploadImage(file());

    expect(mockedCloudinary.uploader.upload_stream).toHaveBeenCalledWith(
      expect.objectContaining({ folder: 'vemtap_onboarding' }),
      expect.any(Function),
    );
  });

  it('maps a Cloudinary failure to a 400', async () => {
    mockUploadStream(null, new Error('quota exceeded'));
    const service = new UploadsService(configService(configuredValues));

    await expect(service.uploadImage(file())).rejects.toThrow(
      BadRequestException,
    );
  });
});
