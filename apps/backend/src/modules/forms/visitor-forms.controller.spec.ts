import { Test, TestingModule } from '@nestjs/testing';
import { VisitorFormsController } from './visitor-forms.controller';
import { FormsService } from './forms.service';

describe('VisitorFormsController', () => {
  let controller: VisitorFormsController;
  let service: FormsService;

  // Mock service to avoid database interactions during visitor requests
  const mockFormsService = {
    getFormsForVisitor: jest.fn(),
    getFormByUniqueCode: jest.fn(),
    submitResponse: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VisitorFormsController],
      providers: [
        {
          provide: FormsService,
          useValue: mockFormsService,
        },
      ],
    }).compile();

    controller = module.get<VisitorFormsController>(VisitorFormsController);
    service = module.get<FormsService>(FormsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test: Ensure a visitor can fetch forms for a specific branch
  it('should find forms for a visitor with branchId', async () => {
    const forms = [{ id: 'form-1', title: 'Survey' }];
    mockFormsService.getFormsForVisitor.mockResolvedValue(forms);

    const result = await controller.findForms('branch-2');

    expect(service.getFormsForVisitor).toHaveBeenCalledWith('branch-2');
    expect(result).toEqual(forms);
  });

  // Test: Ensure a visitor can retrieve a specific form's questions
  it('should get a specific form to fill out', async () => {
    const form = { id: 'form-1', title: 'Survey', fields: [] };
    mockFormsService.getFormByUniqueCode.mockResolvedValue(form);

    const result = await controller.getFormByCode('ABC123XYZ');

    expect(service.getFormByUniqueCode).toHaveBeenCalledWith('ABC123XYZ');
    expect(result).toEqual(form);
  });

  // Test: Verify that a valid submission by a visitor correctly delegates to the service using the visitorId
  it('should submit a form response using the user ID from the request token', async () => {
    const req = { user: { id: 'visitor-123' } } as any;
    const submitDto = {
      branchId: 'branch-1',
      answers: [{ fieldId: 'fld-1', value: 'Answer 1' }],
    };
    const savedResponse = { id: 'resp-1', ...submitDto };

    mockFormsService.submitResponse.mockResolvedValue(savedResponse);

    const result = await controller.submitResponse(
      req,
      'ABC123XYZ',
      submitDto as any,
    );

    expect(service.submitResponse).toHaveBeenCalledWith(
      'ABC123XYZ',
      'visitor-123',
      submitDto,
    );
    expect(result).toEqual(savedResponse);
  });
});
