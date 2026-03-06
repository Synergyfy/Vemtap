import { Test, TestingModule } from '@nestjs/testing';
import { FormsService } from './forms.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Form } from './entities/form.entity';
import { FormField } from './entities/form-field.entity';
import { FormResponse } from './entities/form-response.entity';
import { FormAnswer } from './entities/form-answer.entity';
import { NotFoundException } from '@nestjs/common';

describe('FormsService', () => {
  let service: FormsService;

  const mockFormsRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockFormFieldsRepository = {
    create: jest.fn(),
    delete: jest.fn(),
  };

  const mockFormResponsesRepository = {
    count: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createForm', () => {
    it('should successfully create a form', async () => {
      const branchId = 'branch-1';
      const dto = { title: 'Test Form', description: 'Test Description' };
      const createdForm = { id: 'form-1', ...dto, branchId };

      mockFormsRepository.create.mockReturnValue(createdForm);
      mockFormsRepository.save.mockResolvedValue(createdForm);

      const result = await service.createForm(branchId, dto as any);

      expect(result).toEqual(createdForm);
      expect(mockFormsRepository.create).toHaveBeenCalledWith({
        ...dto,
        branchId,
      });
    });
  });

  describe('getFormsByBranch', () => {
    it('should return forms for a branch', async () => {
      const branchId = 'branch-1';
      const forms = [{ id: 'form-1', title: 'Test Form' }];

      mockFormsRepository.find.mockResolvedValue(forms);

      const result = await service.getFormsByBranch(branchId);

      expect(result).toEqual(forms);
      expect(mockFormsRepository.find).toHaveBeenCalledWith({
        where: { branchId },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('getFormById', () => {
    it('should return a form if found', async () => {
      const branchId = 'branch-1';
      const formId = 'form-1';
      const form = { id: formId, title: 'Test Form', branchId };

      mockFormsRepository.findOne.mockResolvedValue(form);

      const result = await service.getFormById(branchId, formId);

      expect(result).toEqual(form);
    });

    it('should throw NotFoundException if form not found', async () => {
      mockFormsRepository.findOne.mockResolvedValue(null);

      await expect(service.getFormById('b1', 'f1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
