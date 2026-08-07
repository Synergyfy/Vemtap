import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { FosGoalsService } from './fos-goals.service';
import { Goal, Project } from './entities/goal.entity';

describe('FosGoalsService', () => {
  let service: FosGoalsService;

  const mockGoalRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((obj: object) => ({ ...obj })),
    save: jest.fn((row: object) => Promise.resolve({ ...row })),
    remove: jest.fn(),
  };
  const mockProjectRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((obj: object) => ({ ...obj })),
    save: jest.fn((row: object) => Promise.resolve({ ...row })),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FosGoalsService,
        { provide: getRepositoryToken(Goal), useValue: mockGoalRepo },
        { provide: getRepositoryToken(Project), useValue: mockProjectRepo },
      ],
    }).compile();

    service = module.get<FosGoalsService>(FosGoalsService);
  });

  describe('getGoals', () => {
    it('should return goals and projects', async () => {
      mockGoalRepo.find.mockResolvedValue([
        {
          id: 'goal-1',
          name: 'Reach 400 Businesses',
          target: '400',
          current: '342',
          deadline: '2026-10-18',
          category: 'Growth',
        },
      ]);
      mockProjectRepo.find.mockResolvedValue([
        {
          id: 'proj-1',
          name: 'QRThrive V2 Launch',
          budget: '500000',
          spent: '320000',
          revenue: '850000',
          status: 'IN_PROGRESS',
          deadline: '2026-08-18',
        },
      ]);

      const result = await service.getGoals();

      expect(result.goals).toHaveLength(1);
      expect(result.goals[0].target).toBe(400);
      expect(result.projects[0].name).toBe('QRThrive V2 Launch');
    });
  });

  describe('createGoal', () => {
    it('should persist a new goal', async () => {
      const result = await service.createGoal({
        name: 'Reach 500',
        target: 500,
      });

      expect(result.id).toBeUndefined();
      expect(result.target).toBe(500);
    });
  });

  describe('updateGoal', () => {
    it('should throw when missing', async () => {
      mockGoalRepo.findOne.mockResolvedValue(null);
      await expect(service.updateGoal('x', { name: 'Y' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeProject', () => {
    it('should throw when missing', async () => {
      mockProjectRepo.findOne.mockResolvedValue(null);
      await expect(service.removeProject('x')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
