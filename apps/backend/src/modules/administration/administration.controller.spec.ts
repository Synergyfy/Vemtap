import { Test, TestingModule } from '@nestjs/testing';
import { AdministrationController } from './administration.controller';
import { AdministrationService } from './administration.service';
import { AdminCreateAgentDto, GenerateImpersonationTokenDto, GenerateCustomerImpersonationTokenDto, AuditLogFilterDto } from './dto/administration.dto';
import { UserRole } from '../users/entities/user.entity';
import { BackendModule } from '../../common/enums/backend-module.enum';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

describe('AdministrationController', () => {
  let controller: AdministrationController;
  let service: AdministrationService;

  const mockAdminService = {
    createAgent: jest.fn(),
    generateToken: jest.fn(),
    getAuditLogs: jest.fn(),
    listAgents: jest.fn(),
    getActorPermissions: jest.fn(),
    revokeToken: jest.fn(),
    listActorTokens: jest.fn(),
    generateCustomerToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdministrationController],
      providers: [
        {
          provide: AdministrationService,
          useValue: mockAdminService,
        },
      ],
    }).compile();

    controller = module.get<AdministrationController>(AdministrationController);
    service = module.get<AdministrationService>(AdministrationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createAgent', () => {
    it('should call adminService.createAgent', async () => {
      const dto: AdminCreateAgentDto = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'password123',
        phone: '+1234567890',
        permissions: [BackendModule.ALL],
      };
      const result = { id: 'user-id', ...dto, role: UserRole.AGENT };
      mockAdminService.createAgent.mockResolvedValue(result);

      expect(await controller.createAgent(dto)).toEqual(result);
      expect(service.createAgent).toHaveBeenCalledWith(dto);
    });
  });

  describe('generateToken', () => {
    it('should call adminService.generateToken with req.user.id and dto', async () => {
      const req = { user: { id: 'actor-id' } };
      const dto: GenerateImpersonationTokenDto = {
        targetBranchId: 'branch-id',
        expiresAt: '2030-01-01T00:00:00Z',
      };
      const result = { id: 'token-id', actorId: 'actor-id', ...dto };
      mockAdminService.generateToken.mockResolvedValue(result);

      expect(await controller.generateToken(req, dto)).toEqual(result);
      expect(service.generateToken).toHaveBeenCalledWith('actor-id', dto);
    });
  });

  describe('getAuditLogs', () => {
    it('should call adminService.getAuditLogs with filter', async () => {
      const filter: AuditLogFilterDto = { page: 1, limit: 10 };
      const result = { data: [], meta: { total: 0, page: 1, lastPage: 0 } };
      mockAdminService.getAuditLogs.mockResolvedValue(result);

      expect(await controller.getAuditLogs(filter)).toEqual(result);
      expect(service.getAuditLogs).toHaveBeenCalledWith(filter);
    });
  });

  describe('listAgents', () => {
    it('should call adminService.listAgents with filter', async () => {
      const filter: PaginationQueryDto = { page: 1, limit: 10 };
      const result = { data: [], meta: { total: 0, page: 1, lastPage: 0 } };
      mockAdminService.listAgents.mockResolvedValue(result);

      expect(await controller.listAgents(filter)).toEqual(result);
      expect(service.listAgents).toHaveBeenCalledWith(filter);
    });
  });

  describe('getMyPermissions', () => {
    it('should call adminService.getActorPermissions with req.user.id', async () => {
      const req = { user: { id: 'actor-id' } };
      const result = { permissions: [BackendModule.ALL] };
      mockAdminService.getActorPermissions.mockResolvedValue(result);

      expect(await controller.getMyPermissions(req)).toEqual(result);
      expect(service.getActorPermissions).toHaveBeenCalledWith('actor-id');
    });
  });

  describe('revokeToken', () => {
    it('should call adminService.revokeToken with id', async () => {
      const id = 'token-id';
      const result = { message: 'success' };
      mockAdminService.revokeToken.mockResolvedValue(result);

      expect(await controller.revokeToken(id)).toEqual(result);
      expect(service.revokeToken).toHaveBeenCalledWith(id);
    });
  });

  describe('listMyTokens', () => {
    it('should call adminService.listActorTokens with req.user.id', async () => {
      const req = { user: { id: 'actor-id' } };
      const result = [];
      mockAdminService.listActorTokens.mockResolvedValue(result);

      expect(await controller.listMyTokens(req)).toEqual(result);
      expect(service.listActorTokens).toHaveBeenCalledWith('actor-id');
    });
  });

  describe('generateCustomerToken', () => {
    it('should call adminService.generateCustomerToken with req.user.id and dto', async () => {
      const req = { user: { id: 'actor-id' } };
      const dto: GenerateCustomerImpersonationTokenDto = {
        targetCustomerId: 'customer-id',
        targetBranchId: 'branch-id',
        expiresAt: '2030-01-01T00:00:00Z',
      };
      const result = { id: 'token-id', actorId: 'actor-id', ...dto };
      mockAdminService.generateCustomerToken.mockResolvedValue(result);

      expect(await controller.generateCustomerToken(req, dto)).toEqual(result);
      expect(service.generateCustomerToken).toHaveBeenCalledWith('actor-id', dto);
    });
  });
});
