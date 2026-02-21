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
            save: jest.fn().mockImplementation((entity) => Promise.resolve({ id: 't1', ...entity })),
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
            const result = service.render('Hello {Name}, welcome!', { Name: 'Alice' });
            expect(result).toBe('Hello Alice, welcome!');
        });
    });

    describe('createTemplate', () => {
        it('should successfully create and save a template', async () => {
            const template = await service.createTemplate('b1', 'promo', Channel.SMS, 'text');
            expect(repoMock.create).toHaveBeenCalled();
            expect(repoMock.save).toHaveBeenCalled();
            expect(template.id).toBe('t1');
        });
    });
});
