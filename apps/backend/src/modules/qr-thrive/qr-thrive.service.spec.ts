import { Test, TestingModule } from '@nestjs/testing';
import { QrThriveService } from './qr-thrive.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QrThriveUserMapping } from './entities/qr-thrive-user-mapping.entity';
import { QrThriveCodeMapping } from './entities/qr-thrive-code-mapping.entity';
import { ExternalLeadStatusEntity, ExternalLeadStatus } from './entities/external-lead-status.entity';
import { BranchesService } from '../branches/branches.service';
import { of } from 'rxjs';
import { User } from '../users/entities/user.entity';

describe('QrThriveService - Lead Management', () => {
  let service: QrThriveService;
  let leadStatusRepo: any;
  let httpService: any;
  let branchesService: any;

  const mockUser = { id: 'user-1', businessId: 'bus-1' } as User;
  const mockBranchId = 'branch-1';

  beforeEach(async () => {
    leadStatusRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    httpService = {
      get: jest.fn(),
      post: jest.fn(),
    };

    branchesService = {
      checkBranchAccess: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QrThriveService,
        { provide: HttpService, useValue: httpService },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('mock-key') } },
        { provide: BranchesService, useValue: branchesService },
        { provide: getRepositoryToken(QrThriveUserMapping), useValue: {} },
        { provide: getRepositoryToken(QrThriveCodeMapping), useValue: {} },
        { provide: getRepositoryToken(ExternalLeadStatusEntity), useValue: leadStatusRepo },
      ],
    }).compile();

    service = module.get<QrThriveService>(QrThriveService);
  });

  describe('getSpecializedLeads', () => {
    it('should merge local statuses into external leads data', async () => {
      // Mock external data from QR Thrive
      const externalData = {
        data: [{ id: 'lead-1', type: 'booking' }, { id: 'lead-2', type: 'menu' }]
      };
      httpService.get.mockReturnValue(of({ data: externalData }));

      // Mock local status for lead-1
      leadStatusRepo.find.mockResolvedValue([
        { externalLeadId: 'lead-1', status: ExternalLeadStatus.PROCESSING, notes: 'Called' }
      ]);

      // Mock user mapping (needed for the API call)
      (service as any).userMappingRepo.findOne = jest.fn().mockResolvedValue({ qrThriveUserId: 'qt-1' });

      const result = await service.getSpecializedLeads(mockUser, mockBranchId, {});

      expect(result.data[0].status).toBe(ExternalLeadStatus.PROCESSING);
      expect(result.data[0].internalNotes).toBe('Called');
      expect(result.data[1].status).toBe(ExternalLeadStatus.NEW); // Default for untracked lead
    });
  });

  describe('updateLeadStatus', () => {
    it('should update an existing status record', async () => {
      const existingStatus = { externalLeadId: 'lead-1', status: ExternalLeadStatus.NEW };
      leadStatusRepo.findOne.mockResolvedValue(existingStatus);
      leadStatusRepo.save.mockImplementation(val => Promise.resolve(val));

      const result = await service.updateLeadStatus(mockUser, mockBranchId, 'lead-1', ExternalLeadStatus.COMPLETED, 'Done!');

      expect(existingStatus.status).toBe(ExternalLeadStatus.COMPLETED);
      expect(result.notes).toBe('Done!');
      expect(leadStatusRepo.save).toHaveBeenCalled();
    });

    it('should create a new status record if one does not exist', async () => {
      leadStatusRepo.findOne.mockResolvedValue(null);
      leadStatusRepo.create.mockReturnValue({ externalLeadId: 'lead-new' });
      leadStatusRepo.save.mockImplementation(val => Promise.resolve(val));

      await service.updateLeadStatus(mockUser, mockBranchId, 'lead-new', ExternalLeadStatus.PROCESSING);

      expect(leadStatusRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        externalLeadId: 'lead-new',
        status: ExternalLeadStatus.PROCESSING
      }));
    });

    it('should throw forbidden error if user has no access to branch', async () => {
      branchesService.checkBranchAccess.mockResolvedValue(false);

      await expect(
        service.updateLeadStatus(mockUser, mockBranchId, 'lead-1', ExternalLeadStatus.PROCESSING)
      ).rejects.toThrow('You do not have access to this branch');
    });
  });
});
