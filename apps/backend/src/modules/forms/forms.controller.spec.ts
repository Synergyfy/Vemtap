import { Test, TestingModule } from '@nestjs/testing';
import { FormsController } from './forms.controller';
import { FormsService } from './forms.service';

describe('FormsController', () => {
  let controller: FormsController;
  let service: FormsService;

  // Mock service to avoid database calls
  const mockFormsService = {
    createForm: jest.fn(),
    getFormsByBusiness: jest.fn(),
    getFormById: jest.fn(),
    updateForm: jest.fn(),
    deleteForm: jest.fn(),
    getFormResponses: jest.fn(),
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

  // Test: Verify that business owner can list forms via the controller
  it('should list all forms for a business', async () => {
    const req = { user: { businessId: 'bus-1' } };
    const expectedForms = [{ id: 'form-1', title: 'Form 1' }];
    mockFormsService.getFormsByBusiness.mockResolvedValue(expectedForms);

    const result = await controller.findAll(req, {} as any);

    expect(service.getFormsByBusiness).toHaveBeenCalledWith('bus-1', undefined);
    expect(result).toEqual(expectedForms);
  });

  // Test: Verify that a form can be created correctly mapping req.user.businessId
  it('should create a form', async () => {
    const req = { user: { businessId: 'bus-1' } };
    const createDto = { title: 'New Form', fields: [] };
    const createdForm = {
      id: 'new-form-id',
      ...createDto,
      businessId: 'bus-1',
    };
    mockFormsService.createForm.mockResolvedValue(createdForm);

    const result = await controller.create(req, createDto);

    expect(service.createForm).toHaveBeenCalledWith('bus-1', createDto);
    expect(result).toEqual(createdForm);
  });

  // Test: Verify that business owner can get responses for their forms
  it('should retrieve responses for a form', async () => {
    const req = { user: { businessId: 'bus-1' } };
    const responses = [{ id: 'resp-1' }];
    mockFormsService.getFormResponses.mockResolvedValue(responses);

    const result = await controller.findResponses(req, 'form-1');
    expect(service.getFormResponses).toHaveBeenCalledWith('bus-1', 'form-1');
    expect(result).toEqual(responses);
  });
});
