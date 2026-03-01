import { Test, TestingModule } from '@nestjs/testing';
import { TemplateService } from './template.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MessageTemplate, TemplateStatus } from '../entities/message-template.entity';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Channel } from '../enums/channel.enum';
import { User, UserRole } from '../../users/entities/user.entity';
import { IsNull } from 'typeorm';

describe('TemplateService (Strict)', () => {
    let service: TemplateService;
    let repoMock: any;

    const mockAdminUser = { id: 'admin1', role: UserRole.ADMIN } as User;
    const mockOwnerUser = { id: 'owner1', role: UserRole.OWNER, businessId: 'bus1' } as User;
    const mockStaffUser = { id: 'staff1', role: UserRole.STAFF, businessId: 'bus1' } as User;
    const mockOtherUser = { id: 'other1', role: UserRole.OWNER, businessId: 'bus2' } as User;

    beforeEach(async () => {
        const qb = {
            where: jest.fn().mockReturnThis(),
            orWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            addOrderBy: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue([]),
        };

        repoMock = {
            create: jest.fn().mockImplementation((dto) => dto),
            save: jest.fn().mockImplementation((entity) => Promise.resolve({ id: 'uuid', ...entity })),
            findOne: jest.fn(),
            find: jest.fn(),
            remove: jest.fn().mockResolvedValue(undefined),
            createQueryBuilder: jest.fn(() => qb),
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

    describe('createTemplate', () => {
        it('should allow ADMIN to create system templates', async () => {
            repoMock.findOne.mockResolvedValue(null);
            const dto = { name: 'System Msg', channel: Channel.SMS, content: 'Hello', isSystem: true };

            const result = await service.createTemplate(dto as any, mockAdminUser);

            expect(result.isSystem).toBe(true);
            expect(result.businessId).toBeNull();
            expect(result.status).toBe(TemplateStatus.APPROVED);
            expect(repoMock.findOne).toHaveBeenCalledWith({
                where: { businessId: IsNull(), name: dto.name, channel: dto.channel }
            });
        });

        it('should NOT allow non-admins to create system templates', async () => {
            const dto = { name: 'Hack Msg', channel: Channel.SMS, content: 'Bad', isSystem: true };

            await expect(service.createTemplate(dto as any, mockOwnerUser))
                .rejects.toThrow(ForbiddenException);
        });

        it('should allow owners to create business templates', async () => {
            repoMock.findOne.mockResolvedValue(null);
            const dto = { name: 'Business Msg', channel: Channel.WHATSAPP, content: 'Hello' };

            const result = await service.createTemplate(dto as any, mockOwnerUser);

            expect(result.businessId).toBe('bus1');
            expect(result.isSystem).toBe(false);
            expect(result.status).toBe(TemplateStatus.PENDING);
        });

        it('should throw BadRequestException if template name exists in same scope', async () => {
            repoMock.findOne.mockResolvedValue({ id: 'exists' });
            const dto = { name: 'Promo', channel: Channel.SMS, content: 'text' };

            await expect(service.createTemplate(dto as any, mockOwnerUser))
                .rejects.toThrow(BadRequestException);
        });

        it('should validate SMS length strictly', async () => {
            const dto = { name: 'Long Msg', channel: Channel.SMS, content: 'a'.repeat(321) };
            await expect(service.createTemplate(dto as any, mockOwnerUser))
                .rejects.toThrow(BadRequestException);
        });
    });

    describe('getAvailableTemplates', () => {
        it('should query for both system and business specific templates', async () => {
            const qb = repoMock.createQueryBuilder();
            await service.getAvailableTemplates('bus1');

            expect(qb.where).toHaveBeenCalledWith('template.isSystem = :isSystem', { isSystem: true });
            expect(qb.orWhere).toHaveBeenCalledWith('template.businessId = :businessId', { businessId: 'bus1' });
        });
    });

    describe('getTemplate (Access Control)', () => {
        it('should allow anyone to view system templates', async () => {
            const systemTemplate = { id: '1', isSystem: true, businessId: null };
            repoMock.findOne.mockResolvedValue(systemTemplate);

            const result = await service.getTemplate('1', mockOtherUser);
            expect(result).toEqual(systemTemplate);
        });

        it('should allow business users to view their own templates', async () => {
            const busTemplate = { id: '2', isSystem: false, businessId: 'bus1' };
            repoMock.findOne.mockResolvedValue(busTemplate);

            const result = await service.getTemplate('2', mockStaffUser);
            expect(result).toEqual(busTemplate);
        });

        it('should NOT allow business users to view other business templates', async () => {
            const otherBusTemplate = { id: '3', isSystem: false, businessId: 'bus2' };
            repoMock.findOne.mockResolvedValue(otherBusTemplate);

            await expect(service.getTemplate('3', mockOwnerUser))
                .rejects.toThrow(ForbiddenException);
        });

        it('should allow ADMIN to view any template', async () => {
            const otherBusTemplate = { id: '3', isSystem: false, businessId: 'bus2' };
            repoMock.findOne.mockResolvedValue(otherBusTemplate);

            const result = await service.getTemplate('3', mockAdminUser);
            expect(result).toEqual(otherBusTemplate);
        });
    });

    describe('deleteTemplate', () => {
        it('should allow ADMIN to delete system templates', async () => {
            const systemTemplate = { id: '1', isSystem: true, businessId: null };
            repoMock.findOne.mockResolvedValue(systemTemplate);

            await service.deleteTemplate('1', mockAdminUser);
            expect(repoMock.remove).toHaveBeenCalled();
        });

        it('should NOT allow owner to delete system templates', async () => {
            const systemTemplate = { id: '1', isSystem: true, businessId: null };
            repoMock.findOne.mockResolvedValue(systemTemplate);

            await expect(service.deleteTemplate('1', mockOwnerUser))
                .rejects.toThrow(ForbiddenException);
        });
    });
});
