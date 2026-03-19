import { Test, TestingModule } from '@nestjs/testing';
import { FormsController } from './forms.controller';
import { FormsService } from './forms.service';
import { UserRole } from '../users/entities/user.entity';

describe('FormsController', () => {
  let controller: FormsController;
  let service: FormsService;

  // Mock service to avoid database calls
  const mockFormsService = {
    createForm: jest.fn(),
    getFormsByBranch: jest.fn(),
    getFormById: jest.fn(),
    updateForm: jest.fn(),
    deleteForm: jest.fn(),
    getFormResponses: jest.fn(),
    checkBranchAccess: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FormsController],
      providers: [
        {
          provide: FormsService,
          useValue: mockFormsService,
        },
      ],
    }).compile();

    controller = module.get<FormsController>(FormsController);
    service = module.get<FormsService>(FormsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should list all forms for a branch', async () => {
    const req = { user: { id: 'u1', branchId: 'b1', role: UserRole.STAFF } };
    const expectedForms = [{ id: 'form-1', title: 'Form 1' }];
    mockFormsService.getFormsByBranch.mockResolvedValue(expectedForms);

    const result = await controller.findAll(req as any, {});

    expect(service.getFormsByBranch).toHaveBeenCalledWith('b1');
    expect(result).toEqual(expectedForms);
  });

  it('should create a form', async () => {
    const req = { user: { id: 'u1', branchId: 'b1', role: UserRole.MANAGER } };
    const createDto = { title: 'New Form', fields: [], branchId: 'b1' };
    const createdForm = {
      id: 'new-form-id',
      ...createDto,
      businessId: 'bus-1',
    };
    mockFormsService.createForm.mockResolvedValue(createdForm);

    const result = await controller.create(req as any, createDto as any);

    expect(service.createForm).toHaveBeenCalledWith('b1', createDto);
    expect(result).toEqual(createdForm);
  });

  it('should retrieve responses for a form', async () => {
    const req = { user: { id: 'u1', branchId: 'b1', role: UserRole.STAFF } };
    const responses = [{ id: 'resp-1' }];
    mockFormsService.getFormResponses.mockResolvedValue(responses);

    const result = await controller.findResponses(req as any, 'form-1', {});
    expect(service.getFormResponses).toHaveBeenCalledWith('b1', 'form-1');
    expect(result).toEqual(responses);
  });
});
