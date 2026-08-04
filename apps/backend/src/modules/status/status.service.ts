import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Repository, DataSource } from 'typeorm';
import {
  SystemComponent,
  SystemComponentStatus,
} from './entities/status-component.entity';
import { Incident, IncidentStatus } from './entities/incident.entity';
import {
  CreateIncidentDto,
  CreateSystemComponentDto,
  UpdateIncidentDto,
  UpdateSystemComponentDto,
} from './dto/status.dto';

const STATUS_CACHE_KEY = 'status:public';
const STATUS_CACHE_TTL_MS = 60_000;

export interface PublicStatusPayload {
  overall: string;
  systems: {
    name: string;
    status: string;
    statusColor?: string;
    uptime: string;
    load: string;
  }[];
  incidents: {
    id: string;
    date: string;
    title: string;
    desc: string;
    type: string;
  }[];
  uptime90d: string;
  lastUpdated: string;
}

const STATUS_LABEL: Record<
  SystemComponentStatus,
  { label: string; color?: string }
> = {
  [SystemComponentStatus.OPERATIONAL]: { label: 'Operational' },
  [SystemComponentStatus.DEGRADED]: {
    label: 'Degraded Performance',
    color: 'amber',
  },
  [SystemComponentStatus.OUTAGE]: { label: 'Major Outage', color: 'red' },
};

@Injectable()
export class StatusService {
  constructor(
    @InjectRepository(SystemComponent)
    private componentRepo: Repository<SystemComponent>,
    @InjectRepository(Incident)
    private incidentRepo: Repository<Incident>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private dataSource: DataSource,
  ) {}

  private async invalidateCache(): Promise<void> {
    try {
      await this.cacheManager.del(STATUS_CACHE_KEY);
    } catch {
      // cache failures are non-blocking
    }
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  }

  async getPublicStatus(): Promise<PublicStatusPayload> {
    const cached =
      await this.cacheManager.get<PublicStatusPayload>(STATUS_CACHE_KEY);
    if (cached) return cached;

    const components = await this.componentRepo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });

    // Live-probe the DB component so the page reflects real connectivity.
    let dbOperational = this.dataSource.isInitialized;
    try {
      await this.dataSource.query('SELECT 1');
      dbOperational = true;
    } catch {
      dbOperational = false;
    }

    const overall = !dbOperational
      ? 'degraded'
      : components.length === 0
        ? 'operational'
        : components.every(
              (c) => c.status === SystemComponentStatus.OPERATIONAL,
            )
          ? 'operational'
          : components.some((c) => c.status === SystemComponentStatus.OUTAGE)
            ? 'outage'
            : 'degraded';

    const systems = components.map((c) => {
      const isDb = c.slug === 'database' || c.slug === 'core-api';
      const status =
        isDb && !dbOperational ? SystemComponentStatus.DEGRADED : c.status;
      const meta = STATUS_LABEL[status];
      return {
        name: c.name,
        status: meta.label,
        statusColor: meta.color,
        uptime: c.uptime90d,
        load: c.latencyMs != null ? `${c.latencyMs}ms` : '—',
      };
    });

    const incidents = await this.incidentRepo.find({
      order: { occurredAt: 'DESC' },
      take: 20,
    });

    const mappedIncidents = incidents.map((i) => ({
      id: i.id,
      date: this.formatDate(i.occurredAt),
      title: i.title,
      desc: i.description,
      type:
        i.status === IncidentStatus.RESOLVED
          ? 'Resolved'
          : i.status === IncidentStatus.IDENTIFIED ||
              i.status === IncidentStatus.MONITORING
            ? 'Monitoring'
            : 'Investigating',
    }));

    const uptimeValues = components
      .map((c) => parseFloat(c.uptime90d.replace('%', '')))
      .filter((v) => !Number.isNaN(v));
    const uptime90d =
      uptimeValues.length > 0
        ? `${(uptimeValues.reduce((a, b) => a + b, 0) / uptimeValues.length).toFixed(2)}%`
        : '99.98%';

    const result: PublicStatusPayload = {
      overall,
      systems,
      incidents: mappedIncidents,
      uptime90d,
      lastUpdated: new Date().toISOString(),
    };

    try {
      await this.cacheManager.set(
        STATUS_CACHE_KEY,
        result,
        STATUS_CACHE_TTL_MS,
      );
    } catch {
      // cache failures are non-blocking
    }

    return result;
  }

  // --- Admin component CRUD ---

  async createComponent(
    dto: CreateSystemComponentDto,
  ): Promise<SystemComponent> {
    const existing = await this.componentRepo.findOne({
      where: { slug: dto.slug },
    });
    if (existing) {
      Object.assign(existing, dto);
      await this.invalidateCache();
      return this.componentRepo.save(existing);
    }
    const component = this.componentRepo.create(dto);
    const saved = await this.componentRepo.save(component);
    await this.invalidateCache();
    return saved;
  }

  async findAllComponents(): Promise<SystemComponent[]> {
    return this.componentRepo.find({ order: { sortOrder: 'ASC' } });
  }

  async updateComponent(
    id: string,
    dto: UpdateSystemComponentDto,
  ): Promise<SystemComponent> {
    const component = await this.componentRepo.findOne({ where: { id } });
    if (!component) throw new NotFoundException('Component not found');
    Object.assign(component, dto);
    const saved = await this.componentRepo.save(component);
    await this.invalidateCache();
    return saved;
  }

  async removeComponent(id: string): Promise<void> {
    const component = await this.componentRepo.findOne({ where: { id } });
    if (!component) throw new NotFoundException('Component not found');
    await this.componentRepo.remove(component);
    await this.invalidateCache();
  }

  // --- Admin incident CRUD ---

  async createIncident(dto: CreateIncidentDto): Promise<Incident> {
    const incident = this.incidentRepo.create({
      ...dto,
      occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
      resolvedAt: dto.resolvedAt ? new Date(dto.resolvedAt) : null,
    });
    const saved = await this.incidentRepo.save(incident);
    await this.invalidateCache();
    return saved;
  }

  async findAllIncidents(): Promise<Incident[]> {
    return this.incidentRepo.find({ order: { occurredAt: 'DESC' } });
  }

  async updateIncident(id: string, dto: UpdateIncidentDto): Promise<Incident> {
    const incident = await this.incidentRepo.findOne({ where: { id } });
    if (!incident) throw new NotFoundException('Incident not found');
    Object.assign(incident, dto);
    if (dto.occurredAt !== undefined) {
      incident.occurredAt = dto.occurredAt
        ? new Date(dto.occurredAt)
        : new Date();
    }
    if (dto.resolvedAt !== undefined) {
      // Allow clearing resolvedAt back to null (e.g. reopening an incident)
      incident.resolvedAt = dto.resolvedAt ? new Date(dto.resolvedAt) : null;
    }
    const saved = await this.incidentRepo.save(incident);
    await this.invalidateCache();
    return saved;
  }

  async removeIncident(id: string): Promise<void> {
    const incident = await this.incidentRepo.findOne({ where: { id } });
    if (!incident) throw new NotFoundException('Incident not found');
    await this.incidentRepo.remove(incident);
    await this.invalidateCache();
  }
}
