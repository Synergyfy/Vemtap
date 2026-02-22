import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
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
  };

  const mockBranchesService = {
    findOne: jest.fn(),
  };

  const mockUser = { id: 'user-1', email: 'test@example.com', password: 'hashedpassword' };
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
      const updates = { name: 'New Name' };
      const updatedUser = { ...mockUser, ...updates };
      mockUsersService.updateProfile.mockResolvedValue(updatedUser);

      const result = await controller.updateMe(mockReq, updates);
      expect(result).toEqual(updatedUser);
      expect(mockUsersService.updateProfile).toHaveBeenCalledWith('user-1', updates);
    });
  });

  describe('deleteMe', () => {
    it('should deactivate user account', async () => {
      mockUsersService.adminDeleteUser.mockResolvedValue(undefined);
      await controller.deleteMe(mockReq);
      expect(mockUsersService.adminDeleteUser).toHaveBeenCalledWith('user-1');
    });
  });
});
