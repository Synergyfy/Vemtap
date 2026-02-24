import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UserRole } from './entities/user.entity';
import { UsersService } from './users.service';
import { BusinessesService } from '../businesses/businesses.service';
import { BranchesService } from '../branches/branches.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    findOne: jest.fn(),
    updateProfile: jest.fn(),
    adminDeleteUser: jest.fn(),
    findByBusiness: jest.fn(),
    create: jest.fn(),
    findByEmail: jest.fn(),
    updateStaff: jest.fn(),
    remove: jest.fn(),
  };

  const mockBusinessesService = {
    findById: jest.fn(),
    findByOwner: jest.fn(),
  };

  const mockBranchesService = {
    findOne: jest.fn(),
    findById: jest.fn(),
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    password: 'hashedpassword',
  };
  const mockReq = { user: { id: 'user-1' } };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
        { provide: BusinessesService, useValue: mockBusinessesService },
        { provide: BranchesService, useValue: mockBranchesService },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMe', () => {
    it('should return user profile without password', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);
      const result = await controller.getMe(mockReq);
      expect(result).toEqual({ id: 'user-1', email: 'test@example.com' });
      expect(mockUsersService.findOne).toHaveBeenCalledWith('user-1');
    });
  });

  describe('updateMe', () => {
    it('should update user profile', async () => {
      const updates = { firstName: 'New' };
      const updatedUser = { ...mockUser, ...updates };
      mockUsersService.updateProfile.mockResolvedValue(updatedUser);

      const result = await controller.updateMe(mockReq, updates);
      expect(result).toEqual(updatedUser);
      expect(mockUsersService.updateProfile).toHaveBeenCalledWith(
        'user-1',
        updates,
      );
    });
  });

  describe('deleteMe', () => {
    it('should deactivate user account', async () => {
      mockUsersService.adminDeleteUser.mockResolvedValue(undefined);
      await controller.deleteMe(mockReq);
      expect(mockUsersService.adminDeleteUser).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getMyPermissions', () => {
    it('should return user permissions', async () => {
      mockUsersService.findOne.mockResolvedValue({
        ...mockUser,
        permissions: ['dashboard', 'visitors'],
      });
      const result = await controller.getMyPermissions(mockReq);
      expect(result).toEqual({ permissions: ['dashboard', 'visitors'] });
    });

    it('should return empty array if no permissions', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);
      const result = await controller.getMyPermissions(mockReq);
      expect(result).toEqual({ permissions: [] });
    });

    it('should throw BadRequestException if user not found', async () => {
      mockUsersService.findOne.mockResolvedValue(null);
      await expect(controller.getMyPermissions(mockReq)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('inviteStaff', () => {
    const inviteDto: any = {
      email: 'newstaff@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.STAFF,
      branchId: 'branch-1',
    };

    beforeEach(() => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockBusinessesService.findByOwner.mockResolvedValue({ id: 'business-1' });
      mockBranchesService.findById.mockResolvedValue({
        businessId: 'business-1',
      });
      mockUsersService.create.mockResolvedValue({
        id: 'new-user',
        ...inviteDto,
      });
    });

    it('should invite staff successfully for owner context', async () => {
      const req = {
        user: { id: 'owner-1', role: UserRole.OWNER, businessId: undefined },
      };
      const result = await controller.inviteStaff(req, inviteDto);
      expect(result.id).toBe('new-user');
      expect(mockUsersService.create).toHaveBeenCalled();
      const createCall = mockUsersService.create.mock.calls[0][0];
      expect(createCall.businessId).toBe('business-1');
      expect(createCall.branchId).toBe('branch-1');
      expect(createCall.password).toBeDefined();
    });

    it('should invite staff successfully for existing business context', async () => {
      const req = {
        user: {
          id: 'manager-1',
          role: UserRole.MANAGER,
          businessId: 'business-1',
        },
      };
      const result = await controller.inviteStaff(req, inviteDto);
      expect(result.id).toBe('new-user');
    });

    it('should throw BadRequestException if invalid role provided', async () => {
      await expect(
        controller.inviteStaff(mockReq, {
          ...inviteDto,
          role: UserRole.CUSTOMER,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user with email already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ id: 'existing-user' });
      await expect(controller.inviteStaff(mockReq, inviteDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error if business context not found for user', async () => {
      const req = {
        user: { id: 'owner-1', role: UserRole.OWNER, businessId: undefined },
      };
      mockBusinessesService.findByOwner.mockResolvedValue(null);
      await expect(controller.inviteStaff(req, inviteDto)).rejects.toThrow(
        'Business context not found for the user',
      );
    });

    it('should throw error if branch does not exist or belong to business', async () => {
      const req = {
        user: {
          id: 'manager-1',
          role: UserRole.MANAGER,
          businessId: 'business-1',
        },
      };
      mockBranchesService.findById.mockResolvedValue(null);
      await expect(controller.inviteStaff(req, inviteDto)).rejects.toThrow(
        'Branch not found or does not belong to your business',
      );

      mockBranchesService.findById.mockResolvedValue({
        businessId: 'different-business',
      });
      await expect(controller.inviteStaff(req, inviteDto)).rejects.toThrow(
        'Branch not found or does not belong to your business',
      );
    });
  });
});
