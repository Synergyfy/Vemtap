import { Test, TestingModule } from '@nestjs/testing';
import { FormsService } from './forms.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Form } from './entities/form.entity';
import { FormField, FormFieldType } from './entities/form-field.entity';
import { FormResponse } from './entities/form-response.entity';
import { FormAnswer } from './entities/form-answer.entity';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

describe('FormsService', () => {
  let service: FormsService;

  // Mock repositories to supply data without hitting the real database
  const mockFormsRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    })),
  };

  const mockFormFieldsRepository = {
    create: jest.fn(),
    delete: jest.fn(),
  };

  const mockFormResponsesRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockFormAnswersRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FormsService,
        {
          provide: getRepositoryToken(Form),
          useValue: mockFormsRepository,
        },
        {
          provide: getRepositoryToken(FormField),
          useValue: mockFormFieldsRepository,
        },
        {
          provide: getRepositoryToken(FormResponse),
          useValue: mockFormResponsesRepository,
        },
        {
          provide: getRepositoryToken(FormAnswer),
          useValue: mockFormAnswersRepository,
        },
      ],
    }).compile();

    service = module.get<FormsService>(FormsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Business Owner Operations', () => {
    // Test: Verify that a business owner can successfully create a form
    it('should create a form', async () => {
      const dto = { title: 'Test Form', fields: [] };
      const businessId = 'business-1';
      const createdForm = { id: 'form-1', title: 'Test Form', businessId };

      mockFormsRepository.create.mockReturnValue(createdForm);
      mockFormsRepository.save.mockResolvedValue(createdForm);

      const result = await service.createForm(businessId, dto);

      expect(mockFormsRepository.create).toHaveBeenCalledWith({
        ...dto,
        businessId,
      });
      expect(mockFormsRepository.save).toHaveBeenCalledWith(createdForm);
      expect(result).toEqual(createdForm);
    });

    // Test: Verify getting all forms for a business works properly
    it('should get forms by business', async () => {
      const businessId = 'business-1';
      const forms = [{ id: 'form-1' }];
      mockFormsRepository.find.mockResolvedValue(forms);

      const result = await service.getFormsByBusiness(businessId);
      expect(mockFormsRepository.find).toHaveBeenCalledWith({
        where: { businessId },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(forms);
    });

    // Test: Ensure an exception is thrown if a form isn't found for a given business
    it('should throw NotFoundException if form not found', async () => {
      mockFormsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getFormById('business-1', 'form-not-exist'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Visitor Operations', () => {
    // Test: Ensure a visitor can retrieve active forms for a specific business/branch
    it('should get forms for a visitor via query builder', async () => {
      const forms = [{ id: 'form-1' }];
      const queryBuilder: any = mockFormsRepository.createQueryBuilder();
      queryBuilder.getMany.mockResolvedValue(forms);

      const result = await service.getFormsForVisitor('business-1', 'branch-2');

      expect(queryBuilder.where).toHaveBeenCalledWith(
        'form.isActive = :isActive',
        { isActive: true },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'form.isPublished = :isPublished',
        { isPublished: true },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'form.businessId = :businessId',
        { businessId: 'business-1' },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        '(form.branchId IS NULL OR form.branchId = :branchId)',
        { branchId: 'branch-2' },
      );
      expect(result).toEqual(forms);
    });

    // Test: Ensure a visitor gets ForbiddenException if they try to access a form mapped to another branch
    it('should throw ForbiddenException if visitor branches do not match', async () => {
      const form = {
        id: 'form-1',
        branchId: 'correct-branch',
        isActive: true,
        isPublished: true,
      };
      mockFormsRepository.findOne.mockResolvedValue(form);

      await expect(
        service.getFormByIdForVisitor('form-1', 'wrong-branch'),
      ).rejects.toThrow(ForbiddenException);
    });

    // Test: Ensure submission is blocked if required fields are missing
    it('should throw BadRequestException if required field is missing', async () => {
      const form = {
        id: 'form-1',
        isActive: true,
        isPublished: true,
        fields: [
          { id: 'field-1', isRequired: true, question: 'Required Question' },
        ],
      };
      mockFormsRepository.findOne.mockResolvedValue(form);

      const dto = { branchId: 'test-branch', answers: [] }; // No answers provided

      await expect(
        service.submitResponse('form-1', 'visitor-1', dto),
      ).rejects.toThrow(BadRequestException);
    });

    // Test: Verify that a valid response submission is processed and saved correctly
    it('should submit form response successfully', async () => {
      const form = {
        id: 'form-1',
        isActive: true,
        isPublished: true,
        fields: [{ id: 'field-1', isRequired: true }],
      };
      mockFormsRepository.findOne.mockResolvedValue(form);

      const dto = {
        branchId: 'test-branch',
        answers: [{ fieldId: 'field-1', value: 'My Answer' }],
      };
      const savedResponse = {
        id: 'resp-1',
        formId: 'form-1',
        visitorId: 'visitor-1',
        branchId: 'test-branch',
      };

      mockFormResponsesRepository.create.mockReturnValue(savedResponse);
      mockFormResponsesRepository.save.mockResolvedValue(savedResponse);
      mockFormAnswersRepository.create.mockReturnValue({
        responseId: 'resp-1',
        fieldId: 'field-1',
        value: 'My Answer',
      });

      const result = await service.submitResponse('form-1', 'visitor-1', dto);

      expect(mockFormResponsesRepository.save).toHaveBeenCalled();
      expect(mockFormAnswersRepository.save).toHaveBeenCalled();
      expect(result.answers.length).toBe(1);
      expect(result.id).toEqual('resp-1');
    });
  });
});
