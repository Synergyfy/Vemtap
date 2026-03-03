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

@Injectable()
export class TemplateService {
  constructor(
    @InjectRepository(MessageTemplate)
    private readonly templateRepo: Repository<MessageTemplate>,
  ) {}

  async createTemplate(
    dto: CreateTemplateDto,
    user: User,
  ): Promise<MessageTemplate> {
    this.validateFormat(dto.channel, dto.content);

    // Ensure only admins can create system templates
    if (dto.isSystem && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can create system templates.');
    }

    // System templates have no businessId, others use the user's businessId
    const businessId = dto.isSystem ? null : user.businessId;

    if (!dto.isSystem && !businessId) {
      throw new BadRequestException(
        'Business context is required for non-system templates.',
      );
    }

    const existing = await this.templateRepo.findOne({
      where: {
        businessId: businessId ?? IsNull(),
        name: dto.name,
        channel: dto.channel,
      },
    });

    if (existing) {
      throw new BadRequestException(
        'Template with this name already exists for this scope.',
      );
    }

    const template = this.templateRepo.create({
      name: dto.name,
      channel: dto.channel,
      content: dto.content,
      category: dto.category,
      language: dto.language,
      isSystem: dto.isSystem || false,
      businessId: businessId,
      createdById: user.id,
      status: dto.isSystem ? TemplateStatus.APPROVED : TemplateStatus.PENDING,
    });

    return this.templateRepo.save(template);
  }

  /**
   * Returns templates available to a business: all system templates + business-specific templates.
   */
  async getAvailableTemplates(businessId: string): Promise<MessageTemplate[]> {
    return this.templateRepo
      .createQueryBuilder('template')
      .where('template.isSystem = :isSystem', { isSystem: true })
      .orWhere('template.businessId = :businessId', { businessId })
      .orderBy('template.isSystem', 'DESC')
      .addOrderBy('template.name', 'ASC')
      .getMany();
  }

  async getTemplate(id: string, user?: User): Promise<MessageTemplate> {
    const template = await this.templateRepo.findOne({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // Access control: System templates are public-ish to all business users.
    // Business templates are restricted to that business.
    // Admins can see everything.
    // If no user is provided, we skip checks (internal system call).
    if (
      user &&
      user.role !== UserRole.ADMIN &&
      !template.isSystem &&
      template.businessId !== user.businessId
    ) {
      throw new ForbiddenException('Access denied to this template.');
    }

    return template;
  }

  // --- Admin Methods ---

  async findAllAdmin(): Promise<MessageTemplate[]> {
    return this.templateRepo.find({
      relations: ['business'],
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

    // Only owner/manager can delete their own business templates
    // System templates can only be deleted by ADMIN
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
      // Extended limit for concatenated SMS
      throw new BadRequestException(
        'SMS content too long (max 320 characters for templates).',
      );
    }
  }
}
