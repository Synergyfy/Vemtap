import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  HttpException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ListAgentsQueryDto } from './dto/list-agents-query.dto';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

@Injectable()
export class VemtapAffiliateAgentsService {
  private readonly logger = new Logger(VemtapAffiliateAgentsService.name);
  private readonly baseUrl: string;
  private readonly secret: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const configuredUrl = this.configService.get<string>('VEMTAP_AFFILIATE_BASE_URL') || 'http://localhost:4005/api';
    this.baseUrl = configuredUrl.replace(/\/external\/?$/, '');
    this.secret = this.configService.get<string>('VEMTAP_AFFILIATE_KEY') || '';
  }

  private get headers() {
    return {
      'x-api-key': this.secret,
      'Content-Type': 'application/json',
    };
  }

  private handleError(error: any, context: string): never {
    this.logger.error(`Affiliate API ${context} failed: ${error.message}`);
    if (error.response) {
      const { status, data } = error.response;
      if (status === 404) {
        throw new NotFoundException(data?.message || 'Agent not found');
      }
      if (status === 409) {
        throw new ConflictException(data?.message || 'Agent already exists');
      }
      throw new HttpException(data?.message || 'Affiliate API error', status || 500);
    }
    throw new HttpException('Affiliate API unavailable', 503);
  }

  async listAgents(query: ListAgentsQueryDto) {
    try {
      const params = new URLSearchParams();
      if (query.page) params.set('page', String(query.page));
      if (query.perPage) params.set('limit', String(query.perPage));
      if (query.search) params.set('search', query.search);
      if (query.status) params.set('status', query.status);
      const qs = params.toString();
      const { data } = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/agents${qs ? `?${qs}` : ''}`, {
          headers: this.headers,
        }),
      );
      return data;
    } catch (error) {
      this.handleError(error, 'listAgents');
    }
  }

  async getAgentDetail(id: string) {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/agents/${id}`, {
          headers: this.headers,
        }),
      );
      return data;
    } catch (error) {
      this.handleError(error, `getAgentDetail(${id})`);
    }
  }

  async getAgentRevenue(id: string) {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/agents/${id}/revenue`, {
          headers: this.headers,
        }),
      );
      return data;
    } catch (error) {
      this.handleError(error, `getAgentRevenue(${id})`);
    }
  }

  async createAgent(dto: CreateAgentDto) {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/agents`, dto, {
          headers: this.headers,
        }),
      );
      return data;
    } catch (error) {
      this.handleError(error, 'createAgent');
    }
  }

  async updateAgent(id: string, dto: UpdateAgentDto) {
    try {
      const { data } = await firstValueFrom(
        this.httpService.patch(`${this.baseUrl}/agents/${id}`, dto, {
          headers: this.headers,
        }),
      );
      return data;
    } catch (error) {
      this.handleError(error, `updateAgent(${id})`);
    }
  }

  async deleteAgent(id: string) {
    try {
      await firstValueFrom(
        this.httpService.delete(`${this.baseUrl}/agents/${id}`, {
          headers: this.headers,
        }),
      );
    } catch (error) {
      this.handleError(error, `deleteAgent(${id})`);
    }
  }
}
