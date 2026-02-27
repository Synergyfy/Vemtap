import { Test, TestingModule } from '@nestjs/testing';
import { TemplateService } from './template.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MessageTemplate } from '../entities/message-template.entity';
import { BadRequestException } from '@nestjs/common';
import { Channel } from '../enums/channel.enum';

describe('TemplateService', () => {
  let service: TemplateService;
  let repoMock: any;

  beforeEach(async () => {
    repoMock = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest
        .fn()
        .mockImplementation((entity) =>
          Promise.resolve({ id: 't1', ...entity }),
        ),
      findOne: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplateService,
        {
          provide: getRepositoryToken(MessageTemplate),
          useValue: repoMock,
        },
      ],
    }).compile();

    service = module.get<TemplateService>(TemplateService);
  });

  describe('render', () => {
    it('should correctly replace variables in template content', () => {
      const result = service.render('Hello {Name}, welcome!', {
        Name: 'Alice',
      });
      expect(result).toBe('Hello Alice, welcome!');
    });
  });

  describe('createTemplate', () => {
    it('should successfully create and save a template', async () => {
      const dto = {
        name: 'promo',
        channel: Channel.SMS,
        content: 'Hello visitor!',
        category: 'marketing',
      };
      const user = { id: 'u1', businessId: 'b1', role: 'Owner' } as any;
      
      const template = await service.createTemplate(dto as any, user);
      expect(repoMock.create).toHaveBeenCalled();
      expect(repoMock.save).toHaveBeenCalled();
      expect(template.id).toBe('t1');
    });
  });

  describe('findAllAdmin', () => {
    it('should return all templates with business details', async () => {
      const templates = [{ id: 't1' }, { id: 't2' }];
      repoMock.find.mockResolvedValue(templates);

      const result = await service.findAllAdmin();
      expect(result).toEqual(templates);
      expect(repoMock.find).toHaveBeenCalledWith({
        relations: ['business'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('updateStatus', () => {
    it('should update template status', async () => {
      const template = { id: 't1', status: 'pending' };
      repoMock.findOne.mockResolvedValue(template);
      repoMock.save.mockResolvedValue({ ...template, status: 'approved' });

      const result = await service.updateStatus('t1', 'approved');
      expect(result.status).toBe('approved');
    });
  });
});
