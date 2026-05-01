import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ControlTowerService } from './control-tower.service';
import {
  Business,
  BusinessStatus,
} from '../../businesses/entities/business.entity';
import { Contact } from '../../contacts/entities/contact.entity';
import { User, UserRole } from '../../users/entities/user.entity';
import { AdministrationService } from '../../administration/administration.service';
import {
  BusinessSudoActionDto,
  CustomerSudoActionDto,
} from '../dto/control-tower.dto';

const ACTOR_ID = 'actor-uuid-1234';

describe('ControlTowerService', () => {
  let service: ControlTowerService;
  let businessRepo: jest.Mocked<any>;
  let contactRepo: jest.Mocked<any>;
  let userRepo: jest.Mocked<any>;
  let adminService: jest.Mocked<Partial<AdministrationService>>;

  const mockBusiness = {
    id: 'biz-1',
    name: 'Test Biz',
    status: BusinessStatus.ACTIVE,
    owner: { firstName: 'John', lastName: 'Doe' },
    branches: [{ id: 'branch-1' }],
    suspensionReason: null,
  } as any;

  const mockContact = {
    id: 'contact-1',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+2348012345678',
    branchId: 'branch-1',
  } as any;

  const mockImpersonationToken = {
    id: 'token-id-1',
    token: 'real-uuid-token-value',
    actorId: ACTOR_ID,
    targetBranchId: 'branch-1',
    isActive: true,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  };

  const mockCustomerToken = {
    id: 'ctoken-id-1',
    token: 'real-customer-token-value',
    actorId: ACTOR_ID,
    targetCustomerId: 'user-customer-1',
    targetBranchId: 'branch-1',
    isActive: true,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  };

  beforeEach(async () => {
    const mockRepo = () => ({
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      update: jest.fn(),
    });

    adminService = {
      generateToken: jest.fn().mockResolvedValue(mockImpersonationToken),
      generateCustomerToken: jest.fn().mockResolvedValue(mockCustomerToken),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ControlTowerService,
        { provide: getRepositoryToken(Business), useValue: mockRepo() },
        { provide: getRepositoryToken(Contact), useValue: mockRepo() },
        { provide: getRepositoryToken(User), useValue: mockRepo() },
        { provide: AdministrationService, useValue: adminService },
      ],
    }).compile();

    service = module.get<ControlTowerService>(ControlTowerService);
    businessRepo = module.get(getRepositoryToken(Business));
    contactRepo = module.get(getRepositoryToken(Contact));
    userRepo = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // searchBusinesses
  // ──────────────────────────────────────────────────────────────────────────
  describe('searchBusinesses', () => {
    it('should return mapped business control records', async () => {
      businessRepo.find.mockResolvedValue([mockBusiness]);
      userRepo.count.mockResolvedValue(2);

      const result = await service.searchBusinesses({ query: 'Test' });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        uid: 'biz-1',
        name: 'Test Biz',
        owner: 'John Doe',
        status: BusinessStatus.ACTIVE,
      });
      // users = staff count (2) + owner (1)
      expect(result[0].users).toBe(3);
    });

    it('should show N/A for owner when business has no owner', async () => {
      businessRepo.find.mockResolvedValue([{ ...mockBusiness, owner: null, branches: [] }]);
      const result = await service.searchBusinesses({});
      expect(result[0].owner).toBe('N/A');
    });

    it('should return empty array when no businesses found', async () => {
      businessRepo.find.mockResolvedValue([]);
      const result = await service.searchBusinesses({ query: 'nonexistent' });
      expect(result).toHaveLength(0);
    });

    it('should count 0 users when business has no branches', async () => {
      businessRepo.find.mockResolvedValue([{ ...mockBusiness, branches: [], owner: null }]);
      const result = await service.searchBusinesses({});
      expect(result[0].users).toBe(0);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // searchCustomers
  // ──────────────────────────────────────────────────────────────────────────
  describe('searchCustomers', () => {
    it('should return mapped customer control records', async () => {
      contactRepo.find.mockResolvedValue([
        {
          ...mockContact,
          branch: { businessId: 'biz-1', business: { name: 'Test Biz' } },
        },
      ]);

      const result = await service.searchCustomers({ query: 'Jane' });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        uid: 'contact-1',
        name: 'Jane Smith',
        businessUid: 'biz-1',
        businessName: 'Test Biz',
        tier: 'Bronze',
        visits: 0,
      });
    });

    it('should default name to "Anonymous" when contact has no name', async () => {
      contactRepo.find.mockResolvedValue([{ ...mockContact, name: null, branch: null }]);
      const result = await service.searchCustomers({});
      expect(result[0].name).toBe('Anonymous');
    });

    it('should default businessUid/businessName to "N/A" when no branch', async () => {
      contactRepo.find.mockResolvedValue([{ ...mockContact, branch: null }]);
      const result = await service.searchCustomers({});
      expect(result[0].businessUid).toBe('N/A');
      expect(result[0].businessName).toBe('N/A');
    });

    it('should return empty array when no contacts found', async () => {
      contactRepo.find.mockResolvedValue([]);
      const result = await service.searchCustomers({});
      expect(result).toHaveLength(0);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // executeBusinessSudoAction
  // ──────────────────────────────────────────────────────────────────────────
  describe('executeBusinessSudoAction', () => {
    it('should throw NotFoundException when business is not found', async () => {
      businessRepo.findOne.mockResolvedValue(null);

      const dto: BusinessSudoActionDto = {
        businessUid: 'nonexistent',
        actionKey: 'pause',
      };

      await expect(
        service.executeBusinessSudoAction(dto, ACTOR_ID),
      ).rejects.toThrow(NotFoundException);
    });

    describe('pause action', () => {
      it('should suspend the business and return success', async () => {
        businessRepo.findOne.mockResolvedValue({ ...mockBusiness });
        businessRepo.save.mockResolvedValue({});

        const dto: BusinessSudoActionDto = {
          businessUid: 'biz-1',
          actionKey: 'pause',
          ticketRef: 'TKT-001',
        };

        const result = await service.executeBusinessSudoAction(dto, ACTOR_ID);

        expect(result.success).toBe(true);
        expect(result.message).toContain('suspended');
        expect(businessRepo.save).toHaveBeenCalledWith(
          expect.objectContaining({ status: BusinessStatus.SUSPENDED }),
        );
      });

      it('should use "Manual" as suspension reason when no ticketRef provided', async () => {
        const biz = { ...mockBusiness };
        businessRepo.findOne.mockResolvedValue(biz);
        businessRepo.save.mockResolvedValue({});

        await service.executeBusinessSudoAction(
          { businessUid: 'biz-1', actionKey: 'pause' },
          ACTOR_ID,
        );

        expect(biz.suspensionReason).toContain('Manual');
      });
    });

    describe('reset_access action', () => {
      it('should return success without saving', async () => {
        businessRepo.findOne.mockResolvedValue({ ...mockBusiness });

        const result = await service.executeBusinessSudoAction(
          { businessUid: 'biz-1', actionKey: 'reset_access' },
          ACTOR_ID,
        );

        expect(result.success).toBe(true);
        expect(businessRepo.save).not.toHaveBeenCalled();
      });
    });

    describe('add_user action', () => {
      it('should return success without saving', async () => {
        businessRepo.findOne.mockResolvedValue({ ...mockBusiness });

        const result = await service.executeBusinessSudoAction(
          { businessUid: 'biz-1', actionKey: 'add_user' },
          ACTOR_ID,
        );

        expect(result.success).toBe(true);
        expect(businessRepo.save).not.toHaveBeenCalled();
      });
    });

    describe('assume_session action', () => {
      it('should generate a real token and return it', async () => {
        businessRepo.findOne.mockResolvedValue({ ...mockBusiness });

        const dto: BusinessSudoActionDto = {
          businessUid: 'biz-1',
          actionKey: 'assume_session',
          payload: { expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() },
        };

        const result = await service.executeBusinessSudoAction(dto, ACTOR_ID);

        expect(result.success).toBe(true);
        expect(result.data?.token).toBe('real-uuid-token-value');
        expect(adminService.generateToken).toHaveBeenCalledWith(
          ACTOR_ID,
          expect.objectContaining({ targetBranchId: 'branch-1' }),
        );
      });

      it('should default expiry to 15 minutes if no payload.expiresAt provided', async () => {
        businessRepo.findOne.mockResolvedValue({ ...mockBusiness });
        const now = Date.now();
        jest.spyOn(Date, 'now').mockReturnValue(now);

        await service.executeBusinessSudoAction(
          { businessUid: 'biz-1', actionKey: 'assume_session' },
          ACTOR_ID,
        );

        const call = (adminService.generateToken as jest.Mock).mock.calls[0][1];
        const expiresAt = new Date(call.expiresAt).getTime();
        // Allow 1s tolerance
        expect(expiresAt).toBeGreaterThanOrEqual(now + 15 * 60 * 1000 - 1000);
        expect(expiresAt).toBeLessThanOrEqual(now + 15 * 60 * 1000 + 1000);
      });

      it('should throw NotFoundException when business has no branches', async () => {
        businessRepo.findOne.mockResolvedValue({ ...mockBusiness, branches: [] });

        await expect(
          service.executeBusinessSudoAction(
            { businessUid: 'biz-1', actionKey: 'assume_session' },
            ACTOR_ID,
          ),
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('unknown action', () => {
      it('should return success: false with a "not implemented" message', async () => {
        businessRepo.findOne.mockResolvedValue({ ...mockBusiness });

        const result = await service.executeBusinessSudoAction(
          { businessUid: 'biz-1', actionKey: 'send_message' },
          ACTOR_ID,
        );

        expect(result.success).toBe(false);
        expect(result.message).toContain('not fully implemented');
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // executeCustomerSudoAction
  // ──────────────────────────────────────────────────────────────────────────
  describe('executeCustomerSudoAction', () => {
    it('should throw NotFoundException when contact is not found', async () => {
      contactRepo.findOne.mockResolvedValue(null);

      await expect(
        service.executeCustomerSudoAction(
          { customerUid: 'nonexistent', businessUid: 'biz-1', actionKey: 'award_points' },
          ACTOR_ID,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    describe('award_points action', () => {
      it('should return success', async () => {
        contactRepo.findOne.mockResolvedValue(mockContact);

        const result = await service.executeCustomerSudoAction(
          { customerUid: 'contact-1', businessUid: 'biz-1', actionKey: 'award_points', payload: { points: 100 } },
          ACTOR_ID,
        );

        expect(result.success).toBe(true);
        expect(result.message).toContain('Points awarded');
      });

      it('should fallback to contact id in message when name is null', async () => {
        contactRepo.findOne.mockResolvedValue({ ...mockContact, name: null });

        const result = await service.executeCustomerSudoAction(
          { customerUid: 'contact-1', businessUid: 'biz-1', actionKey: 'award_points' },
          ACTOR_ID,
        );

        expect(result.message).toContain('contact-1');
      });
    });

    describe('update_contact action', () => {
      it('should update email and phone and save the contact', async () => {
        const contact = { ...mockContact };
        contactRepo.findOne.mockResolvedValue(contact);
        contactRepo.save.mockResolvedValue(contact);

        await service.executeCustomerSudoAction(
          {
            customerUid: 'contact-1',
            businessUid: 'biz-1',
            actionKey: 'update_contact',
            payload: { new_email: 'new@example.com', new_phone: '+2340000000' },
          },
          ACTOR_ID,
        );

        expect(contact.email).toBe('new@example.com');
        expect(contact.phone).toBe('+2340000000');
        expect(contactRepo.save).toHaveBeenCalledWith(contact);
      });

      it('should only update email if new_phone is not provided', async () => {
        const contact = { ...mockContact };
        contactRepo.findOne.mockResolvedValue(contact);
        contactRepo.save.mockResolvedValue(contact);

        await service.executeCustomerSudoAction(
          {
            customerUid: 'contact-1',
            businessUid: 'biz-1',
            actionKey: 'update_contact',
            payload: { new_email: 'changed@example.com' },
          },
          ACTOR_ID,
        );

        expect(contact.email).toBe('changed@example.com');
        expect(contact.phone).toBe(mockContact.phone); // unchanged
      });
    });

    describe('close_issue action', () => {
      it('should return success without saving', async () => {
        contactRepo.findOne.mockResolvedValue(mockContact);

        const result = await service.executeCustomerSudoAction(
          { customerUid: 'contact-1', businessUid: 'biz-1', actionKey: 'close_issue' },
          ACTOR_ID,
        );

        expect(result.success).toBe(true);
        expect(contactRepo.save).not.toHaveBeenCalled();
      });
    });

    describe('assume_session action', () => {
      it('should resolve User by email and generate a customer token', async () => {
        contactRepo.findOne.mockResolvedValue(mockContact);
        // First userRepo.findOne call = by email
        userRepo.findOne.mockResolvedValueOnce({ id: 'user-customer-1' });

        const dto: CustomerSudoActionDto = {
          customerUid: 'contact-1',
          businessUid: 'biz-1',
          actionKey: 'assume_session',
          payload: { expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() },
        };

        const result = await service.executeCustomerSudoAction(dto, ACTOR_ID);

        expect(result.success).toBe(true);
        expect(result.data?.token).toBe('real-customer-token-value');
        expect(adminService.generateCustomerToken).toHaveBeenCalledWith(
          ACTOR_ID,
          expect.objectContaining({ targetCustomerId: 'user-customer-1', targetBranchId: 'branch-1' }),
        );
      });

      it('should fallback to phone lookup when email lookup returns no user', async () => {
        contactRepo.findOne.mockResolvedValue({ ...mockContact, email: null });
        // Email lookup = null, phone lookup = user
        userRepo.findOne.mockResolvedValueOnce({ id: 'user-customer-phone' });

        const result = await service.executeCustomerSudoAction(
          { customerUid: 'contact-1', businessUid: 'biz-1', actionKey: 'assume_session' },
          ACTOR_ID,
        );

        expect(result.success).toBe(true);
        expect(adminService.generateCustomerToken).toHaveBeenCalledWith(
          ACTOR_ID,
          expect.objectContaining({ targetCustomerId: 'user-customer-phone' }),
        );
      });

      it('should throw BadRequestException when no User account is found for the contact', async () => {
        contactRepo.findOne.mockResolvedValue(mockContact);
        // Both email and phone lookups return null
        userRepo.findOne.mockResolvedValue(null);

        await expect(
          service.executeCustomerSudoAction(
            { customerUid: 'contact-1', businessUid: 'biz-1', actionKey: 'assume_session' },
            ACTOR_ID,
          ),
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException when contact has no branchId', async () => {
        contactRepo.findOne.mockResolvedValue({ ...mockContact, branchId: null });
        userRepo.findOne.mockResolvedValueOnce({ id: 'user-customer-1' });

        await expect(
          service.executeCustomerSudoAction(
            { customerUid: 'contact-1', businessUid: 'biz-1', actionKey: 'assume_session' },
            ACTOR_ID,
          ),
        ).rejects.toThrow(BadRequestException);
      });

      it('should default expiry to 15 minutes if no payload.expiresAt provided', async () => {
        contactRepo.findOne.mockResolvedValue(mockContact);
        userRepo.findOne.mockResolvedValueOnce({ id: 'user-customer-1' });
        const now = Date.now();
        jest.spyOn(Date, 'now').mockReturnValue(now);

        await service.executeCustomerSudoAction(
          { customerUid: 'contact-1', businessUid: 'biz-1', actionKey: 'assume_session' },
          ACTOR_ID,
        );

        const call = (adminService.generateCustomerToken as jest.Mock).mock.calls[0][1];
        const expiresAt = new Date(call.expiresAt).getTime();
        expect(expiresAt).toBeGreaterThanOrEqual(now + 15 * 60 * 1000 - 1000);
        expect(expiresAt).toBeLessThanOrEqual(now + 15 * 60 * 1000 + 1000);
      });
    });

    describe('unknown action', () => {
      it('should return success: false with a "not implemented" message', async () => {
        contactRepo.findOne.mockResolvedValue(mockContact);

        const result = await service.executeCustomerSudoAction(
          { customerUid: 'contact-1', businessUid: 'biz-1', actionKey: 'add_profile' },
          ACTOR_ID,
        );

        expect(result.success).toBe(false);
        expect(result.message).toContain('not fully implemented');
      });
    });
  });
});
