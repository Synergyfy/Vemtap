import { Test, TestingModule } from '@nestjs/testing';
import { InboxService } from './inbox.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConversationThread, ThreadStatus } from '../entities/conversation-thread.entity';
import { Message } from '../entities/message.entity';
import { MessagingEngineService } from './messaging-engine.service';
import { NotFoundException } from '@nestjs/common';

describe('InboxService', () => {
    let service: InboxService;
    let threadRepoMock: any;
    let messageRepoMock: any;
    let engineMock: any;

    beforeEach(async () => {
        threadRepoMock = {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn().mockImplementation((t) => Promise.resolve(t)),
        };

        // We replace query builder to just return execute() for testing
        threadRepoMock.createQueryBuilder = jest.fn(() => ({
            update: jest.fn().mockReturnThis(),
            set: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            execute: jest.fn().mockResolvedValue({ affected: 1 }),
        }));

        messageRepoMock = {
            find: jest.fn(),
            findOne: jest.fn(),
        };

        engineMock = {
            sendReply: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InboxService,
                {
                    provide: getRepositoryToken(ConversationThread),
                    useValue: threadRepoMock,
                },
                {
                    provide: getRepositoryToken(Message),
                    useValue: messageRepoMock,
                },
                {
                    provide: MessagingEngineService,
                    useValue: engineMock,
                },
            ],
        }).compile();

        service = module.get<InboxService>(InboxService);
    });

    describe('sendReply', () => {
        it('should throw NotFoundException if thread does not exist', async () => {
            threadRepoMock.findOne.mockResolvedValue(null);
            await expect(service.sendReply('b1', 't1', 'hello')).rejects.toThrow(NotFoundException);
        });

        it('should send reply via engine, update thread status to OPEN, and return message', async () => {
            const mockThread = { id: 't1', businessId: 'b1', status: ThreadStatus.CLOSED } as any;
            threadRepoMock.findOne.mockResolvedValue(mockThread);
            engineMock.sendReply.mockResolvedValue('msg1');
            messageRepoMock.findOne.mockResolvedValue({ id: 'msg1', content: 'hello' } as any);

            const result = await service.sendReply('b1', 't1', 'hello');

            expect(engineMock.sendReply).toHaveBeenCalledWith(mockThread, 'hello');
            expect(mockThread.status).toBe(ThreadStatus.OPEN);
            expect(threadRepoMock.save).toHaveBeenCalledWith(mockThread);
            expect(result).toBeDefined();
            expect(result!.content).toBe('hello');
        });
    });

    describe('closeInactiveThreads', () => {
        it('should execute query builder to update inactive threads', async () => {
            await service.closeInactiveThreads(7);
            expect(threadRepoMock.createQueryBuilder).toHaveBeenCalled();
        });
    });
});
