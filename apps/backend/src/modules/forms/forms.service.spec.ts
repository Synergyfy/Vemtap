import { Test, TestingModule } from '@nestjs/testing';
import { FormsService } from './forms.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Form } from './entities/form.entity';
import { FormField, FormFieldType } from './entities/form-field.entity';
import { FormResponse } from './entities/form-response.entity';
import { FormAnswer } from './entities/form-answer.entity';
import { FormTemplate } from './entities/form-template.entity';
import { FormFieldTemplate } from './entities/form-field-template.entity';
import { NotFoundException } from '@nestjs/common';
import { BranchesService } from '../branches/branches.service';
import { CreateFormTemplateDto } from './dto/create-form-template.dto';
import { FormTemplateQueryDto } from './dto/form-template-query.dto';

describe('FormsService', () => {
  let service: FormsService;

  const mockFormsRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    remove: jest.fn(),
  };

  const mockFormFieldsRepository = {
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockFormResponsesRepository = {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockFormAnswersRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockFormTemplatesRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockFormFieldTemplatesRepository = {
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockBranchesService = {
    checkBranchAccess: jest.fn(),
    findById: jest
      .fn()
      .mockResolvedValue({ id: 'branch-1', businessId: 'bus-1' }),
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
        {
          provide: getRepositoryToken(FormTemplate),
          useValue: mockFormTemplatesRepository,
        },
        {
          provide: getRepositoryToken(FormFieldTemplate),
          useValue: mockFormFieldTemplatesRepository,
        },
        {
          provide: BranchesService,
          useValue: mockBranchesService,
        },
      ],
    }).compile();

    service = module.get<FormsService>(FormsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTemplate', () => {
    it('should successfully create a template', async () => {
      const dto: CreateFormTemplateDto = {
        name: 'Test Template',
        description: 'Test Desc',
        fields: [
          {
            type: FormFieldType.TEXT,
            question: 'What is your name?',
            isRequired: true,
            order: 0,
          },
        ],
      };

      const mockField = { id: 'field-1', ...dto.fields[0] };
      const mockTemplate = {
        id: 'template-1',
        name: dto.name,
        description: dto.description,
        fields: [mockField],
      };

      mockFormFieldTemplatesRepository.create.mockReturnValue(mockField);
      mockFormTemplatesRepository.create.mockReturnValue(mockTemplate);
      mockFormTemplatesRepository.save.mockResolvedValue(mockTemplate);

      const result = await service.createTemplate(dto);

      expect(result).toEqual(mockTemplate);
      expect(mockFormTemplatesRepository.create).toHaveBeenCalled();
      expect(mockFormTemplatesRepository.save).toHaveBeenCalled();
    });
  });

  describe('findAllTemplates', () => {
    it('should return templates and count', async () => {
      const query: FormTemplateQueryDto = {
        search: 'test',
        page: 1,
        limit: 10,
      };
      const templates = [{ id: '1', name: 'test' }];
      const count = 1;

      mockFormTemplatesRepository.findAndCount.mockResolvedValue([
        templates,
        count,
      ]);

      const result = await service.findAllTemplates(query);

      expect(result).toEqual({ items: templates, total: count });
    });
  });

  describe('findTemplateById', () => {
    it('should return template if found', async () => {
      const template = { id: '1', name: 'test' };
      mockFormTemplatesRepository.findOne.mockResolvedValue(template);

      const result = await service.findTemplateById('1');
      expect(result).toEqual(template);
    });

    it('should throw NotFoundException if template not found', async () => {
      mockFormTemplatesRepository.findOne.mockResolvedValue(null);
      await expect(service.findTemplateById('1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('useTemplate', () => {
    it('should create a form from a template', async () => {
      const templateId = 'template-1';
      const branchId = 'branch-1';
      const template = {
        id: templateId,
        name: 'Template',
        description: 'Desc',
        fields: [
          {
            type: FormFieldType.TEXT,
            question: 'Q1',
            isRequired: true,
            order: 0,
          },
        ],
      };

      const mockForm = {
        id: 'form-1',
        title: 'Template',
        branchId,
        businessId: 'bus-1',
      };
      const mockField = { id: 'field-1', formId: 'form-1', question: 'Q1' };

      mockFormTemplatesRepository.findOne.mockResolvedValue(template);
      mockBranchesService.findById.mockResolvedValue({
        id: branchId,
        businessId: 'bus-1',
      });
      mockFormsRepository.create.mockReturnValue(mockForm);
      mockFormsRepository.save.mockResolvedValue(mockForm);
      mockFormFieldsRepository.create.mockReturnValue(mockField);
      mockFormFieldsRepository.save.mockResolvedValue([mockField]);

      const result = await service.useTemplate(branchId, templateId);

      expect(result).toEqual({ ...mockForm, fields: [mockField] });
      expect(mockFormsRepository.save).toHaveBeenCalled();
      expect(mockFormFieldsRepository.save).toHaveBeenCalled();
    });
  });
});
