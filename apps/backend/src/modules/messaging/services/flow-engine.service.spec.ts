import { Test, TestingModule } from '@nestjs/testing';
import { FlowEngineService } from './flow-engine.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import { Flow, FlowStatus, FlowTriggerType } from '../entities/flow.entity';
import { FlowExecution, ExecutionStatus } from '../entities/flow-execution.entity';
import { Contact } from '../../contacts/entities/contact.entity';
import { MessagingEngineService } from './messaging-engine.service';
import { Channel } from '../enums/channel.enum';

describe('FlowEngineService', () => {
  let service: FlowEngineService;
  let flowRepoMock: any;
  let executionRepoMock: any;
  let contactRepoMock: any;
  let messagingEngineMock: any;
  let delayQueueMock: any;

  beforeEach(async () => {
    flowRepoMock = {
      find: jest.fn(),
    };
    executionRepoMock = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation(dto => ({ ...dto, id: 'exec-1' })),
      save: jest.fn().mockImplementation(e => Promise.resolve(e)),
    };
    contactRepoMock = {
      findOne: jest.fn(),
    };
    messagingEngineMock = {
      sendMessage: jest.fn().mockResolvedValue({ messageIds: ['msg-123'] }),
    };
    delayQueueMock = {
      add: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FlowEngineService,
        { provide: getRepositoryToken(Flow), useValue: flowRepoMock },
        { provide: getRepositoryToken(FlowExecution), useValue: executionRepoMock },
        { provide: getRepositoryToken(Contact), useValue: contactRepoMock },
        { provide: MessagingEngineService, useValue: messagingEngineMock },
        { provide: getQueueToken('messaging-flow-delay'), useValue: delayQueueMock },
      ],
    }).compile();

    service = module.get<FlowEngineService>(FlowEngineService);
  });

  describe('triggerFlow', () => {
    const branchId = 'branch-1';
    const context = { contactId: 'contact-1' };

    it('should trigger active flow and execute first node', async () => {
      const flow = {
        id: 'flow-1',
        businessId: 'biz-1',
        branchId,
        status: FlowStatus.ACTIVE,
        structure: {
            nodes: [
                { id: 'node-1', type: 'send_message', data: { message: 'Hello' } }
            ],
            edges: []
        }
      };

      flowRepoMock.find.mockResolvedValue([flow]);
      contactRepoMock.findOne.mockResolvedValue({ id: 'contact-1' });
      executionRepoMock.findOne.mockResolvedValue(null); // No duplicates

      // Mock executeNode internal call by ensuring execution fetch returns proper flow
      executionRepoMock.findOne
        .mockResolvedValueOnce(null) // for duplicate check
        .mockResolvedValue({ // for executeNode
            id: 'exec-1',
            flow,
            contactId: 'contact-1',
            currentNodeId: 'node-1',
            businessId: 'biz-1',
            branchId
        });

      await service.triggerFlow(FlowTriggerType.NEW_VISITOR, branchId, context);

      expect(executionRepoMock.create).toHaveBeenCalled();
      expect(messagingEngineMock.sendMessage).toHaveBeenCalledWith(expect.objectContaining({
          content: 'Hello',
          channel: Channel.WHATSAPP
      }));
    });

    it('should queue delay node', async () => {
        const flow = {
          id: 'flow-1',
          structure: {
              nodes: [
                  { id: 'node-1', type: 'delay', data: { time: 5, unit: 'minutes' } }
              ],
              edges: []
          }
        };

        // Simulate triggering directly to executeNode logic
        executionRepoMock.findOne.mockResolvedValue({
            id: 'exec-1',
            flow,
            currentNodeId: 'node-1'
        });

        await service.executeNode('exec-1', 'node-1');

        expect(delayQueueMock.add).toHaveBeenCalledWith(
            'process-delay',
            { executionId: 'exec-1', nodeId: 'node-1' },
            { delay: 300000 }
        );
        expect(executionRepoMock.save).toHaveBeenCalledWith(expect.objectContaining({
            status: ExecutionStatus.WAITING
        }));
    });
  });
});
