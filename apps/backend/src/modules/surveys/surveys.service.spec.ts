import { Test, TestingModule } from '@nestjs/testing';
import { SurveysService } from './surveys.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Survey, SurveyTriggerType } from './entities/survey.entity';
import { CreateSurveyDto } from './dto/create-survey.dto';

describe('SurveysService', () => {
  let service: SurveysService;
  let repository: any;

  const mockSurvey = {
    id: 'survey-1',
    businessId: 'biz-1',
    questions: [],
    triggerType: SurveyTriggerType.INSTANT,
    isActive: true,
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest
        .fn()
        .mockImplementation((survey) =>
          Promise.resolve({ ...survey, id: 'survey-1' }),
        ),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SurveysService,
        { provide: getRepositoryToken(Survey), useValue: mockRepository },
      ],
    }).compile();

    service = module.get<SurveysService>(SurveysService);
    repository = module.get(getRepositoryToken(Survey));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByBusiness', () => {
    it('should return survey for a business', async () => {
      repository.findOne.mockResolvedValue(mockSurvey);
      const result = await service.findByBusiness('biz-1');
      expect(result).toEqual(mockSurvey);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { businessId: 'biz-1' },
      });
    });
  });

  describe('createOrUpdate', () => {
    it('should create a new survey if not exists', async () => {
      repository.findOne.mockResolvedValue(null);
      const dto: CreateSurveyDto = {
        questions: [{ id: 'q1', text: 'Q1', type: 'rating' }],
        triggerType: SurveyTriggerType.DELAYED,
        triggerDelay: 5,
        targetAudience: { new: true, returning: false },
        isActive: true,
      };

      const result = await service.createOrUpdate('biz-1', dto);
      expect(result.businessId).toBe('biz-1');
      expect(result.questions).toHaveLength(1);
      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
    });

    it('should update existing survey', async () => {
      repository.findOne.mockResolvedValue({ ...mockSurvey });
      const dto: any = {
        isActive: false,
      };

      const result = await service.createOrUpdate('biz-1', dto);
      expect(result.isActive).toBe(false);
      expect(repository.save).toHaveBeenCalled();
      expect(repository.create).not.toHaveBeenCalled();
    });
  });
});
