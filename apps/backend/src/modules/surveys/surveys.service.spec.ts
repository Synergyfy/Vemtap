import { Test, TestingModule } from '@nestjs/testing';
import { SurveysService } from './surveys.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Survey } from './entities/survey.entity';

describe('SurveysService', () => {
  let service: SurveysService;

  const mockSurveyRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SurveysService,
        {
          provide: getRepositoryToken(Survey),
          useValue: mockSurveyRepository,
        },
      ],
    }).compile();

    service = module.get<SurveysService>(SurveysService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByBranch', () => {
    it('should return a survey for a branch', async () => {
      const survey = { id: '1', branchId: 'branch-1' };
      mockSurveyRepository.findOne.mockResolvedValue(survey);

      const result = await service.findByBranch('branch-1');
      expect(result).toEqual(survey);
      expect(mockSurveyRepository.findOne).toHaveBeenCalledWith({
        where: { branchId: 'branch-1' },
      });
    });
  });

  describe('createOrUpdate', () => {
    it('should update an existing survey', async () => {
      const existing = { id: '1', branchId: 'branch-1', questions: [] };
      const dto = { questions: [{ id: 'q1', text: 'How is it?' }] };

      mockSurveyRepository.findOne.mockResolvedValue(existing);
      mockSurveyRepository.save.mockResolvedValue({ ...existing, ...dto });

      const result = await service.createOrUpdate('branch-1', dto as any);
      expect(result.questions).toEqual(dto.questions);
    });

    it('should create a new survey if none exists', async () => {
      const dto = { questions: [] };
      mockSurveyRepository.findOne.mockResolvedValue(null);
      mockSurveyRepository.create.mockReturnValue({
        ...dto,
        branchId: 'branch-1',
      });
      mockSurveyRepository.save.mockResolvedValue({
        id: 'new-id',
        ...dto,
        branchId: 'branch-1',
      });

      const result = await service.createOrUpdate('branch-1', dto);
      expect(result.branchId).toBe('branch-1');
    });
  });
});
