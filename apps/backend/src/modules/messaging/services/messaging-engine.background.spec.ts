import { Test, TestingModule } from '@nestjs/testing';
import { MessagingEngineService } from './messaging-engine.service';
import { getQueueToken } from '@nestjs/bullmq';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ComplianceService } from './compliance.service';
import { CreditService } from './credit.service';
import { TemplateService } from './template.service';
import { CampaignService } from './campaign.service';
import { SettingsService } from '../../settings/settings.service';
import { ProviderRouterService } from './provider-router.service';
import { BranchesService } from '../../branches/branches.service';
import { DataSource } from 'typeorm';

import { Contact } from '../../contacts/entities/contact.entity';
import { Message } from '../entities/message.entity';
import { MessageLog } from '../entities/message-log.entity';
import { ConversationThread } from '../entities/conversation-thread.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { LoyaltyProfile } from '../../campaigns/entities/loyalty-profile.entity';
import { Channel } from '../enums/channel.enum';

describe('MessagingEngineService (Background Processing)', () => {
  let service: MessagingEngineService;
  let mockBatchQueue: any;
  let mockIndividualQueue: any;
  let contactRepoMock: any;
  let branchRepoMock: any;

  beforeEach(async () => {
    mockBatchQueue = { add: jest.fn() };
    mockIndividualQueue = { add: jest.fn() };
    
    branchRepoMock = {
      findOne: jest.fn().mockResolvedValue({ 
        id: 'br1', 
        businessId: 'biz1',
        whatsappNumber: '+1234567890',
        business: { id: 'biz1', name: 'Biz' }
      }),
    };

    contactRepoMock = {
      find: jest.fn().mockResolvedValue([{ id: 'c1' }, { id: 'c2' }]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagingEngineService,
        { provide: getRepositoryToken(Contact), useValue: contactRepoMock },
        { provide: getRepositoryToken(Message), useValue: {} },
        { provide: getRepositoryToken(MessageLog), useValue: {} },
        { provide: getRepositoryToken(ConversationThread), useValue: {} },
        { provide: getRepositoryToken(Business), useValue: {} },
        { provide: getRepositoryToken(Branch), useValue: branchRepoMock },
        { provide: getRepositoryToken(LoyaltyProfile), useValue: {} },
        { provide: getQueueToken('messaging-batch-send'), useValue: mockBatchQueue },
        { provide: getQueueToken('messaging-individual-send'), useValue: mockIndividualQueue },
        { provide: ComplianceService, useValue: {} },
        { provide: CreditService, useValue: {} },
        { provide: TemplateService, useValue: { findOne: jest.fn() } },
        { provide: CampaignService, useValue: { createCampaign: jest.fn().mockResolvedValue({ id: 'camp1' }) } },
        { provide: SettingsService, useValue: { getSettings: jest.fn().mockResolvedValue({ whatsappNumber: '+1234567890' }) } },
        { provide: ProviderRouterService, useValue: {} },
        { provide: BranchesService, useValue: { checkBranchAccess: jest.fn() } },
        { provide: DataSource, useValue: {} },
      ],
    }).compile();

    service = module.get<MessagingEngineService>(MessagingEngineService);
  });

  it('should return immediately and process in background for individual messages', async () => {
    const dto = {
      branchId: 'br1',
      contactIds: ['c1', 'c2'],
      content: 'Hello {Name}',
      channel: Channel.WHATSAPP,
    };

    const result = await service.sendMessage(dto);

    expect(result.status).toBe('QUEUED');
    expect(result.message).toBe('Messages queued for background processing');
    expect(mockIndividualQueue.add).toHaveBeenCalledTimes(2);
    expect(mockIndividualQueue.add).toHaveBeenCalledWith('send-individual', expect.objectContaining({
      contactId: 'c1',
      content: 'Hello {Name}',
    }));
  });

  it('should use batch queue for more than 50 contacts', async () => {
    const manyContacts = Array.from({ length: 51 }, (_, i) => ({ id: `c${i}` }));
    contactRepoMock.find.mockResolvedValueOnce(manyContacts);

    const dto = {
      branchId: 'br1',
      contactIds: manyContacts.map(c => c.id),
      content: 'Hello everyone',
      channel: Channel.WHATSAPP,
    };

    const result = await service.sendMessage(dto);

    expect(result.status).toBe('QUEUED');
    expect(result.message).toBe('Batch campaign queued');
    expect(mockBatchQueue.add).toHaveBeenCalledWith('send-batch', expect.objectContaining({
      contactIds: manyContacts.map(c => c.id),
    }));
    expect(mockIndividualQueue.add).not.toHaveBeenCalled();
  });
});
