import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UserRole } from './entities/user.entity';
import { UsersService } from './users.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { BranchesService } from '../branches/branches.service';
import { BusinessesService } from '../businesses/businesses.service';
import { QrThriveService } from '../qr-thrive/qr-thrive.service';

describe('UsersController', () => {
  let controller: UsersController;

  const mockUsersService = {
    findOne: jest.fn(),
    updateProfile: jest.fn(),
    adminDeleteUser: jest.fn(),
    findByBranch: jest.fn(),
    findTeamMembers: jest.fn(),
    create: jest.fn(),
    findByEmail: jest.fn(),
    updateStaff: jest.fn(),
    remove: jest.fn(),
    updateEngagement: jest.fn(),
    findAllAdmin: jest.fn(),
    adminCreateAgent: jest.fn(),
    adminCreateUser: jest.fn(),
    adminUpdateUser: jest.fn(),
    suspendUser: jest.fn(),
    activateUser: jest.fn(),
    adminResetPasswordLink: jest.fn(),
  };

  const mockSubscriptionsService = {
    getCapabilities: jest.fn(),
  };

  const mockBranchesService = {
    findOne: jest.fn(),
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    password: 'hashedpassword',
    branchId: 'branch-1',
  };
  const mockReq = { user: { id: 'user-1', branchId: 'branch-1' } };

  const mockBusinessesService = {
    findOne: jest.fn(),
  };

  const mockQrThriveService = {
    getMappingByUserId: jest.fn(),
    provisionUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
        { provide: SubscriptionsService, useValue: mockSubscriptionsService },
        { provide: BranchesService, useValue: mockBranchesService },
        { provide: BusinessesService, useValue: mockBusinessesService },
        { provide: QrThriveService, useValue: mockQrThriveService },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);
      const result = await controller.getProfile(mockReq);
      expect(result).toEqual(mockUser);
      expect(mockUsersService.findOne).toHaveBeenCalledWith('user-1');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updates = { firstName: 'New' };
      const updatedUser = { ...mockUser, ...updates };
      mockUsersService.updateProfile.mockResolvedValue(updatedUser);

      const result = await controller.updateProfile(mockReq, updates);
      expect(result).toEqual(updatedUser);
      expect(mockUsersService.updateProfile).toHaveBeenCalledWith(
        'user-1',
        updates,
      );
    });
  });

  describe('getTeam', () => {
    it('should return team members for the branch', async () => {
      const team = [{ id: 'user-2', role: UserRole.STAFF }];
      mockUsersService.findTeamMembers.mockResolvedValue(team);

      const result = await controller.getTeam(mockReq, {
        branchId: 'branch-1',
      });
      expect(result).toEqual(team);
      expect(mockUsersService.findTeamMembers).toHaveBeenCalledWith({
        branchId: 'branch-1',
        businessId: undefined,
      });
    });
  });

  describe('updateStaff', () => {
    it('should update staff in branch', async () => {
      const updates = { role: UserRole.MANAGER };
      mockUsersService.updateStaff.mockResolvedValue({
        id: 'user-2',
        ...updates,
      });

      const result = await controller.updateStaff(mockReq, 'user-2', updates, {
        branchId: 'branch-1',
      });
      expect(result.id).toBe('user-2');
      expect(mockUsersService.updateStaff).toHaveBeenCalledWith(
        'user-2',
        'branch-1',
        updates,
      );
    });
  });

  describe('remove', () => {
    it('should remove staff from branch', async () => {
      mockUsersService.remove.mockResolvedValue(undefined);

      await controller.remove(mockReq, 'user-2', { branchId: 'branch-1' });
      expect(mockUsersService.remove).toHaveBeenCalledWith(
        'user-2',
        'branch-1',
      );
    });
  });
});
