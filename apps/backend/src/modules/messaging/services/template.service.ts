import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import {
  MessageTemplate,
  TemplateStatus,
} from '../entities/message-template.entity';
import { Channel } from '../enums/channel.enum';
import { CreateTemplateDto } from '../dto/template/create-template.dto';
import { User, UserRole } from '../../users/entities/user.entity';
import { BranchesService } from '../../branches/branches.service';

@Injectable()
export class TemplateService {
  constructor(
    @InjectRepository(MessageTemplate)
    private readonly templateRepo: Repository<MessageTemplate>,
    private readonly branchesService: BranchesService,
  ) {}

  async checkBranchAccess(user: User, branchId: string): Promise<boolean> {
    return this.branchesService.checkBranchAccess(user, branchId);
  }

  async createTemplate(
    dto: CreateTemplateDto,
    user: User,
  ): Promise<MessageTemplate> {
    this.validateFormat(dto.channel, dto.content);

    if (dto.isSystem && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can create system templates.');
    }

    const branchId = dto.isSystem ? null : dto.branchId || user.branchId;

    if (!dto.isSystem && !branchId) {
      throw new BadRequestException(
        'Branch context is required for non-system templates.',
      );
    }

    const where: any = {
      branchId: branchId ?? IsNull(),
      name: dto.name,
      channel: dto.channel,
    };

    const existing = await this.templateRepo.findOne({ where });

    if (existing) {
      throw new BadRequestException(
        'Template with this name already exists for this scope.',
      );
    }

    let businessId: string | null = null;
    if (branchId) {
      const branch = await this.branchesService.findById(branchId);
      businessId = branch.businessId;
    }

    const template = this.templateRepo.create({
      name: dto.name,
      channel: dto.channel,
      content: dto.content,
      category: dto.category,
      language: dto.language,
      isSystem: dto.isSystem || false,
      branchId: branchId as string,
      businessId: businessId as string,
      createdById: user.id,
      status: dto.isSystem ? TemplateStatus.APPROVED : TemplateStatus.PENDING,
    });

    return this.templateRepo.save(template);
  }

  async getAvailableTemplates(branchId: string): Promise<MessageTemplate[]> {
    return this.templateRepo
      .createQueryBuilder('template')
      .where('template.isSystem = :isSystem', { isSystem: true })
      .orWhere('template.branchId = :branchId', { branchId })
      .orderBy('template.isSystem', 'DESC')
      .addOrderBy('template.name', 'ASC')
      .getMany();
  }

  async findOne(id: string): Promise<MessageTemplate> {
    const template = await this.templateRepo.findOne({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }
    return template;
  }

  async getTemplate(id: string, user?: User): Promise<MessageTemplate> {
    const template = await this.findOne(id);

    if (user && user.role !== UserRole.ADMIN && !template.isSystem) {
      if (user.role === UserRole.OWNER) {
        const hasAccess = await this.branchesService.checkBranchAccess(
          user,
          template.branchId,
        );
        if (!hasAccess)
          throw new ForbiddenException('Access denied to this template.');
      } else if (template.branchId !== user.branchId) {
        throw new ForbiddenException('Access denied to this template.');
      }
    }

    return template;
  }

  // --- Admin Methods ---

  async findAllAdmin(): Promise<MessageTemplate[]> {
    return this.templateRepo.find({
      relations: ['branch'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(
    id: string,
    status: TemplateStatus,
  ): Promise<MessageTemplate> {
    const template = await this.templateRepo.findOne({ where: { id } });
    if (!template) throw new NotFoundException('Template not found');

    template.status = status;
    return this.templateRepo.save(template);
  }

  async deleteTemplate(id: string, user: User): Promise<void> {
    const template = await this.getTemplate(id, user);

    if (template.isSystem && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can delete system templates.');
    }

    await this.templateRepo.remove(template);
  }

  render(content: string, vars: Record<string, string>): string {
    let rendered = content;
    for (const [key, value] of Object.entries(vars)) {
      const placeholder = `{${key}}`;
      rendered = rendered.split(placeholder).join(value || '');
    }
    return rendered;
  }

  private validateFormat(channel: Channel, content: string): void {
    if (!content || content.trim() === '') {
      throw new BadRequestException('Template content cannot be empty.');
    }

    if (channel === Channel.SMS && content.length > 320) {
      throw new BadRequestException(
        'SMS content too long (max 320 characters for templates).',
      );
    }
  }
}
