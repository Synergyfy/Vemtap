import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { DataSource } from 'typeorm';
import { StatusService } from './status.service';
import {
  SystemComponent,
  SystemComponentStatus,
} from './entities/status-component.entity';
import { Incident, IncidentStatus } from './entities/incident.entity';
import { NotFoundException } from '@nestjs/common';

describe('StatusService', () => {
  let service: StatusService;

  const mockComponentRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockIncidentRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockDataSource = {
    isInitialized: true,
    query: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
  };

  const mockCacheManager = {
    get: jest.fn().mockResolvedValue(undefined),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatusService,
        {
          provide: getRepositoryToken(SystemComponent),
          useValue: mockComponentRepo,
        },
        {
          provide: getRepositoryToken(Incident),
          useValue: mockIncidentRepo,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<StatusService>(StatusService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPublicStatus', () => {
    it('shapes components/incidents for the status page', async () => {
      mockComponentRepo.find.mockResolvedValue([
        {
          slug: 'nfc-response-api',
          name: 'NFC Response API',
          status: SystemComponentStatus.OPERATIONAL,
          latencyMs: 12,
          uptime90d: '99.99%',
        },
        {
          slug: 'crm-webhook-delivery',
          name: 'CRM Webhook Delivery',
          status: SystemComponentStatus.DEGRADED,
          latencyMs: 4500,
          uptime90d: '98.50%',
        },
      ]);

      mockIncidentRepo.find.mockResolvedValue([
        {
          id: 'inc-1',
          title: 'Scheduled Database Maintenance',
          description: 'Completed with zero downtime.',
          occurredAt: new Date('2026-01-28T00:00:00Z'),
          status: IncidentStatus.RESOLVED,
        },
      ]);

      const result = await service.getPublicStatus();

      expect(result.overall).toBe('degraded');
      expect(result.systems).toHaveLength(2);
      expect(result.systems[1]).toEqual(
        expect.objectContaining({
          name: 'CRM Webhook Delivery',
          status: 'Degraded Performance',
          statusColor: 'amber',
          load: '4500ms',
        }),
      );
      expect(result.incidents[0]).toEqual(
        expect.objectContaining({
          title: 'Scheduled Database Maintenance',
          type: 'Resolved',
        }),
      );
      expect(result.uptime90d).toBe('99.25%');
      expect(result.lastUpdated).toBeDefined();
      expect(mockCacheManager.set).toHaveBeenCalled();
    });

    it('serves a cached payload without hitting the DB', async () => {
      const cached = { overall: 'operational', systems: [], incidents: [] };
      mockCacheManager.get.mockResolvedValue(cached);

      const result = await service.getPublicStatus();

      expect(result).toEqual(cached);
      expect(mockComponentRepo.find).not.toHaveBeenCalled();
    });
  });

  describe('admin component CRUD', () => {
    it('creates a new component', async () => {
      const dto = { slug: 'api', name: 'Core API' };
      mockComponentRepo.findOne.mockResolvedValue(null);
      mockComponentRepo.create.mockReturnValue(dto);
      mockComponentRepo.save.mockResolvedValue({ id: 'c1', ...dto });

      const result = await service.createComponent(dto);
      expect(result.id).toBe('c1');
    });

    it('throws NotFoundException when updating a missing component', async () => {
      mockComponentRepo.findOne.mockResolvedValue(null);
      await expect(service.updateComponent('x', { name: 'n' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('admin incident CRUD', () => {
    it('creates an incident with a default occurredAt', async () => {
      mockIncidentRepo.create.mockReturnValue({ title: 'Outage' });
      mockIncidentRepo.save.mockResolvedValue({ id: 'i1', title: 'Outage' });

      const result = await service.createIncident({
        title: 'Outage',
        description: 'Down',
      });
      expect(result.id).toBe('i1');
    });

    it('throws NotFoundException when removing a missing incident', async () => {
      mockIncidentRepo.findOne.mockResolvedValue(null);
      await expect(service.removeIncident('x')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
