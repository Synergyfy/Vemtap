import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { KnowledgeBaseService } from './knowledge-base.service';
import { KbCategory } from './entities/kb-category.entity';
import { KbSection } from './entities/kb-section.entity';
import { KbPage } from './entities/kb-page.entity';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

describe('KnowledgeBaseService', () => {
  let service: KnowledgeBaseService;

  const mockCategoryRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest
      .fn()
      .mockImplementation((cat) => Promise.resolve({ id: 'cat-1', ...cat })),
    remove: jest.fn(),
  };

  const mockSectionRepo = {
    findOne: jest.fn(),
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest
      .fn()
      .mockImplementation((sec) => Promise.resolve({ id: 'sec-1', ...sec })),
    remove: jest.fn(),
  };

  const mockPageRepo = {
    findOne: jest.fn(),
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest
      .fn()
      .mockImplementation((page) => Promise.resolve({ id: 'page-1', ...page })),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KnowledgeBaseService,
        {
          provide: getRepositoryToken(KbCategory),
          useValue: mockCategoryRepo,
        },
        {
          provide: getRepositoryToken(KbSection),
          useValue: mockSectionRepo,
        },
        {
          provide: getRepositoryToken(KbPage),
          useValue: mockPageRepo,
        },
      ],
    }).compile();

    service = module.get<KnowledgeBaseService>(KnowledgeBaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPublicTree', () => {
    it('should return full category/section/page tree', async () => {
      mockCategoryRepo.find.mockResolvedValue([
        {
          id: 'cat-1',
          title: 'Category 1',
          order: 0,
          sections: [
            {
              id: 'sec-1',
              title: 'Section 1',
              order: 0,
              pages: [
                {
                  id: 'page-1',
                  title: 'Page 1',
                  path: 'pos/getting-started',
                  summary: 'Summary',
                  thumbnail: null,
                  order: 0,
                },
              ],
            },
          ],
        },
      ]);

      const tree = await service.getPublicTree();
      expect(tree.categories).toHaveLength(1);
      expect(tree.categories[0].sections).toHaveLength(1);
      expect(tree.categories[0].sections[0].pages).toHaveLength(1);
      expect(tree.categories[0].sections[0].pages[0].path).toBe(
        'pos/getting-started',
      );
    });
  });

  describe('getPageByPath', () => {
    it('should return page when found by path', async () => {
      mockPageRepo.findOne.mockResolvedValue({
        id: 'page-1',
        title: 'POS Guide',
        path: 'pos/getting-started',
        summary: 'Guide',
        thumbnail: null,
        blocks: [],
        tips: null,
        categoryId: 'cat-1',
        sectionId: 'sec-1',
        order: 0,
      });

      const page = await service.getPageByPath('pos/getting-started');
      expect(page.id).toBe('page-1');
      expect(page.path).toBe('pos/getting-started');
    });

    it('should throw NotFoundException when path is not found', async () => {
      mockPageRepo.findOne.mockResolvedValue(null);
      await expect(service.getPageByPath('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createPage', () => {
    it('should create page when data and path are valid', async () => {
      mockPageRepo.findOne.mockResolvedValue(null);
      mockCategoryRepo.findOne.mockResolvedValue({ id: 'cat-1' });
      mockSectionRepo.findOne.mockResolvedValue({ id: 'sec-1' });

      const dto = {
        title: 'New Page',
        path: 'pos/new-page',
        summary: 'Summary',
        blocks: [],
        categoryId: 'cat-1',
        sectionId: 'sec-1',
      };

      const page = await service.createPage(dto);
      expect(page.title).toBe('New Page');
    });

    it('should throw ConflictException if path already exists', async () => {
      mockPageRepo.findOne.mockResolvedValue({ id: 'existing-page' });

      const dto = {
        title: 'New Page',
        path: 'pos/getting-started',
        summary: 'Summary',
        blocks: [],
        categoryId: 'cat-1',
        sectionId: 'sec-1',
      };

      await expect(service.createPage(dto)).rejects.toThrow(ConflictException);
    });
  });
});
