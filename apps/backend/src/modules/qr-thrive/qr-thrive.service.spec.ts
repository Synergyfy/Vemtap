import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { QrThriveService } from './qr-thrive.service';
import { QrThriveUserMapping } from './entities/qr-thrive-user-mapping.entity';
import { QrThriveCodeMapping } from './entities/qr-thrive-code-mapping.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { QRType } from './enums';
import { HttpStatus, HttpException } from '@nestjs/common';
import { BranchesService } from '../branches/branches.service';

describe('QrThriveService', () => {
  let service: QrThriveService;
  let httpService: HttpService;
  let branchesService: BranchesService;
  let userMappingRepo: any;
  let codeMappingRepo: any;

  const mockUser: Partial<User> = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.OWNER,
    businessId: 'bus-123',
  };

  const mockResponse = <T>(data: T, status = 200): AxiosResponse<T> => ({
    data,
    status,
    statusText: 'OK',
    headers: {},
    config: { headers: {} } as any,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QrThriveService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
            get: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'QR_THRIVE_API_KEY') return 'test-api-key';
              if (key === 'QR_THRIVE_BASE_URL') return 'https://api.qrthrive.com/v1';
              return null;
            }),
          },
        },
        {
          provide: BranchesService,
          useValue: {
            checkBranchAccess: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: getRepositoryToken(QrThriveUserMapping),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(QrThriveCodeMapping),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<QrThriveService>(QrThriveService);
    httpService = module.get<HttpService>(HttpService);
    branchesService = module.get<BranchesService>(BranchesService);
    userMappingRepo = module.get(getRepositoryToken(QrThriveUserMapping));
    codeMappingRepo = module.get(getRepositoryToken(QrThriveCodeMapping));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('syncUser', () => {
    it('should create a new mapping if it does not exist', async () => {
      userMappingRepo.findOne.mockResolvedValue(null);
      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse({ id: 'qr-thrive-u-1' })));
      userMappingRepo.create.mockReturnValue({ userId: mockUser.id, qrThriveUserId: 'qr-thrive-u-1' });
      userMappingRepo.save.mockResolvedValue({ id: 'mapped-1', ...mockUser });

      const result = await service.syncUser(mockUser as User);

      expect(httpService.post).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('createQRCode', () => {
    it('should throw if user has no access to branch', async () => {
      (branchesService.checkBranchAccess as jest.Mock).mockResolvedValue(false);
      await expect(service.createQRCode(mockUser as User, 'branch-1', {} as any)).rejects.toThrow(
        HttpException,
      );
    });

    it('should create a QR code and save mapping when access is granted', async () => {
      userMappingRepo.findOne.mockResolvedValue({ qrThriveUserId: 'qr-u-1' });
      const qrData = { id: 'qr-code-uuid', shortId: 'abcd', name: 'Test', type: QRType.url };
      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse(qrData)));
      codeMappingRepo.create.mockReturnValue(qrData);
      codeMappingRepo.save.mockResolvedValue(qrData);

      const result = await service.createQRCode(mockUser as User, 'branch-1', { name: 'Test', type: QRType.url, data: {} });

      expect(branchesService.checkBranchAccess).toHaveBeenCalled();
      expect(codeMappingRepo.save).toHaveBeenCalled();
      expect(result.shortId).toBe('abcd');
    });
  });

  describe('error handling', () => {
    it('should sanitize external errors', async () => {
      userMappingRepo.findOne.mockResolvedValue({ qrThriveUserId: 'qr-u-1' });
      const errorResponse = {
        response: {
          status: 400,
          data: { message: 'Invalid data format' }
        },
        message: 'Request failed with status code 400'
      };
      
      jest.spyOn(httpService, 'post').mockReturnValue(throwError(() => errorResponse));

      try {
        await service.createQRCode(mockUser as User, 'branch-1', {} as any);
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.message).toBe('QR-Thrive Error: Invalid data format');
        expect(e.getStatus()).toBe(400);
      }
    });

    it('should return default message for 500 errors', async () => {
      userMappingRepo.findOne.mockResolvedValue({ qrThriveUserId: 'qr-u-1' });
      const errorResponse = {
        response: {
          status: 500,
          data: { message: 'Internal Server Error' }
        },
        message: 'Internal Server Error'
      };
      
      jest.spyOn(httpService, 'post').mockReturnValue(throwError(() => errorResponse));

      try {
        await service.createQRCode(mockUser as User, 'branch-1', {} as any);
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.message).toBe('Failed to create QR code in QR-Thrive');
        expect(e.getStatus()).toBe(500);
      }
    });
  describe('getPlans', () => {
    it('should fetch plans from QR-Thrive', async () => {
      const mockPlans = [{ id: 'plan-1', name: 'Premium' }];
      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse(mockPlans)));

      const result = await service.getPlans();

      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining('/integration/plans'),
        expect.objectContaining({ headers: expect.any(Object) })
      );
      expect(result).toEqual(mockPlans);
    });

    it('should handle errors when fetching plans', async () => {
      jest.spyOn(httpService, 'get').mockReturnValue(throwError(() => ({ 
        response: { status: 500 },
        message: 'Server error'
      })));

      await expect(service.getPlans()).rejects.toThrow(HttpException);
    });
  });

  describe('syncSubscription', () => {
    it('should send subscription sync request to QR-Thrive', async () => {
      userMappingRepo.findOne.mockResolvedValue({ qrThriveUserId: 'qr-u-1' });
      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse({ status: 'success' })));

      await service.syncSubscription('user-123', 'plan-thrive-1');

      expect(httpService.post).toHaveBeenCalledWith(
        expect.stringContaining('/integration/users/qr-u-1/subscription'),
        { planId: 'plan-thrive-1' },
        expect.objectContaining({ headers: expect.any(Object) })
      );
    });

    it('should log warning if user mapping is missing', async () => {
      userMappingRepo.findOne.mockResolvedValue(null);
      const loggerSpy = jest.spyOn(service['logger'], 'warn');

      await service.syncSubscription('user-123', 'plan-thrive-1');

      expect(httpService.post).not.toHaveBeenCalled();
      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('not synced'));
    });

    it('should handle HTTP errors during sync', async () => {
      userMappingRepo.findOne.mockResolvedValue({ qrThriveUserId: 'qr-u-1' });
      jest.spyOn(httpService, 'post').mockReturnValue(throwError(() => ({ 
        response: { status: 404, data: { message: 'Not Found' } },
        message: 'Request failed'
      })));

      await expect(service.syncSubscription('user-123', 'plan-thrive-1')).rejects.toThrow(HttpException);
    });
  });
  });
});
