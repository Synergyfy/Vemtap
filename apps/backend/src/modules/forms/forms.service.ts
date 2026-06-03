import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { Form } from './entities/form.entity';
import { FormField } from './entities/form-field.entity';
import { FormResponse } from './entities/form-response.entity';
import { FormAnswer } from './entities/form-answer.entity';
import { FormTemplate } from './entities/form-template.entity';
import { FormFieldTemplate } from './entities/form-field-template.entity';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { SubmitFormResponseDto } from './dto/submit-form-response.dto';
import { CreateFormTemplateDto } from './dto/create-form-template.dto';
import { UpdateFormTemplateDto } from './dto/update-form-template.dto';
import { FormTemplateQueryDto } from './dto/form-template-query.dto';
import { AdminFormQueryDto } from './dto/admin-form.dto';
import { BranchesService } from '../branches/branches.service';
import { DevicesService } from '../devices/devices.service';
import { FormTemplateStatsDto } from './dto/form-template-stats.dto';
import { User } from '../users/entities/user.entity';
import { Branch } from '../branches/entities/branch.entity';
import { UpdateBranchFormSettingsDto } from './dto/update-branch-form-settings.dto';

@Injectable()
export class FormsService {
  constructor(
    @InjectRepository(Form)
    private readonly formsRepository: Repository<Form>,
    @InjectRepository(FormField)
    private readonly formFieldsRepository: Repository<FormField>,
    @InjectRepository(FormResponse)
    private readonly formResponsesRepository: Repository<FormResponse>,
    @InjectRepository(FormAnswer)
    private readonly formAnswersRepository: Repository<FormAnswer>,
    @InjectRepository(FormTemplate)
    private readonly formTemplatesRepository: Repository<FormTemplate>,
    @InjectRepository(FormFieldTemplate)
    private readonly formFieldTemplatesRepository: Repository<FormFieldTemplate>,
    @InjectRepository(Branch)
    private readonly branchesRepository: Repository<Branch>,
    private readonly branchesService: BranchesService,

    private readonly devicesService: DevicesService,
  ) {}

  async checkBranchAccess(user: User, branchId: string): Promise<boolean> {
    return this.branchesService.checkBranchAccess(user, branchId);
  }

  async createForm(
    branchId: string,
    dto: CreateFormDto,
    creatorId?: string,
  ): Promise<Form> {
    const branch = await this.branchesService.findById(branchId);
    const form = this.formsRepository.create({
      ...dto,
      branchId,
      businessId: branch.businessId,
      creatorId,
    });
    return this.formsRepository.save(form);
  }

  async getFormsByBranch(branchId: string): Promise<Form[]> {
    return this.formsRepository.find({
      where: { branchId },
      relations: ['fields'],
      order: { createdAt: 'DESC' },
    });
  }

  async getFormById(branchId: string, id: string): Promise<Form> {
    const form = await this.formsRepository.findOne({
      where: { id, branchId },
      relations: ['fields'],
    });

    if (!form) throw new NotFoundException('Form not found');
    return form;
  }

  async getFormByUniqueCode(uniqueCode: string): Promise<Form> {
    const isUuid =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
        uniqueCode,
      );
    const where: FindOptionsWhere<Form>[] = [
      { uniqueCode, isPublished: true, isActive: true, adminDisabled: false },
    ];

    if (isUuid) {
      where.push({
        id: uniqueCode,
        isPublished: true,
        isActive: true,
        adminDisabled: false,
      });
    }

    const form = await this.formsRepository.findOne({
      where,
      relations: ['fields', 'branch', 'branch.business'],
    });

    if (!form) throw new NotFoundException('Form not found');
    return form;
  }

  async updateForm(
    branchId: string,
    id: string,
    dto: UpdateFormDto,
  ): Promise<Form> {
    const form = await this.getFormById(branchId, id);
    Object.assign(form, dto);

    if (dto.fields) {
      await this.formFieldsRepository.delete({ formId: id });
      form.fields = dto.fields.map((field) =>
        this.formFieldsRepository.create({ ...field, formId: id }),
      );
    }

    return this.formsRepository.save(form);
  }

  async deleteForm(branchId: string, id: string): Promise<void> {
    const form = await this.getFormById(branchId, id);
    await this.formsRepository.remove(form);
  }

  async getFormResponses(
    branchId: string,
    formId: string,
  ): Promise<FormResponse[]> {
    return this.formResponsesRepository.find({
      where: { formId, branchId },
      relations: ['answers', 'answers.field', 'visitor'],
      order: { createdAt: 'DESC' },
    });
  }

  // Template Methods
  async createTemplate(dto: CreateFormTemplateDto): Promise<FormTemplate> {
    const template = this.formTemplatesRepository.create({
      name: dto.name,
      description: dto.description,
      fields: dto.fields.map((field) =>
        this.formFieldTemplatesRepository.create(field),
      ),
    });
    return this.formTemplatesRepository.save(template);
  }

  async findAllTemplates(
    query: FormTemplateQueryDto,
  ): Promise<{ items: FormTemplate[]; total: number }> {
    const { search, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<FormTemplate>[] = [];
    if (search) {
      where.push({ name: Like(`%${search}%`) });
      where.push({ description: Like(`%${search}%`) });
    }

    const [items, total] = await this.formTemplatesRepository.findAndCount({
      where: where.length > 0 ? where : undefined,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
      relations: ['fields'],
    });

    return { items, total };
  }

  async findTemplateById(id: string): Promise<FormTemplate> {
    const template = await this.formTemplatesRepository.findOne({
      where: { id },
      relations: ['fields'],
    });
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async updateTemplate(
    id: string,
    dto: UpdateFormTemplateDto,
  ): Promise<FormTemplate> {
    const template = await this.findTemplateById(id);

    if (dto.name) template.name = dto.name;
    if (dto.description !== undefined)
      template.description = dto.description ?? '';

    if (dto.fields) {
      // For simplicity in this implementation, we replace fields
      // In a production app, you might want to sync them more granularly
      await this.formFieldTemplatesRepository.delete({ templateId: id });
      template.fields = dto.fields.map((field) =>
        this.formFieldTemplatesRepository.create({ ...field, templateId: id }),
      );
    }

    return this.formTemplatesRepository.save(template);
  }

  async deleteTemplate(id: string): Promise<void> {
    const template = await this.findTemplateById(id);
    await this.formTemplatesRepository.remove(template);
  }

  async getTemplateStats(templateId: string): Promise<FormTemplateStatsDto> {
    const template = await this.findTemplateById(templateId);

    const forms = await this.formsRepository.find({
      where: { templateId },
      relations: ['branch', 'branch.business'],
      select: {
        id: true,
        responseCount: true,
        branchId: true,
        businessId: true,
        branch: {
          id: true,
          name: true,
          business: {
            id: true,
            name: true,
          },
        },
      },
    });

    const usageCount = forms.length;
    const totalResponses = forms.reduce(
      (sum, form) => sum + (form.responseCount || 0),
      0,
    );
    const uniqueBranchesCount = new Set(
      forms.map((f) => f.branchId).filter(Boolean),
    ).size;
    const uniqueBusinessesCount = new Set(
      forms.map((f) => f.businessId).filter(Boolean),
    ).size;

    const usage = forms.map((form) => ({
      formId: form.id,
      branchName: form.branch?.name || 'Unknown Branch',
      businessName: form.branch?.business?.name || 'Unknown Business',
      responseCount: form.responseCount || 0,
    }));

    return {
      templateId,
      templateName: template.name,
      usageCount,
      totalResponses,
      uniqueBranchesCount,
      uniqueBusinessesCount,
      usage,
    };
  }

  async getAllTemplatesStats(): Promise<FormTemplateStatsDto[]> {
    const templates = await this.formTemplatesRepository.find({
      select: ['id', 'name'],
    });

    const stats = await Promise.all(
      templates.map((template) => this.getTemplateStats(template.id)),
    );

    return stats;
  }

  async useTemplate(
    branchId: string,
    templateId: string,
    creatorId?: string,
  ): Promise<Form> {
    const template = await this.findTemplateById(templateId);
    const branch = await this.branchesService.findById(branchId);

    const form = this.formsRepository.create({
      title: template.name,
      description: template.description,
      branchId,
      businessId: branch.businessId,
      templateId,
      creatorId,
      isActive: true,
      isPublished: false,
    });

    const savedForm = await this.formsRepository.save(form);

    const fields = template.fields.map((tField) =>
      this.formFieldsRepository.create({
        formId: savedForm.id,
        type: tField.type,
        question: tField.question,
        options: tField.options,
        isRequired: tField.isRequired,
        order: tField.order,
      }),
    );

    await this.formFieldsRepository.save(fields);
    savedForm.fields = fields;

    return savedForm;
  }

  // Admin Methods
  async findAllForAdmin(
    query: AdminFormQueryDto,
  ): Promise<{ items: Form[]; total: number }> {
    const { branchId, businessId, search, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Form>[] = [];

    const baseWhere: FindOptionsWhere<Form> = {};
    if (branchId) baseWhere.branchId = branchId;
    if (businessId) baseWhere.businessId = businessId;

    if (search) {
      where.push({ ...baseWhere, title: Like(`%${search}%`) });
      where.push({ ...baseWhere, description: Like(`%${search}%`) });
    } else {
      where.push(baseWhere);
    }

    const [items, total] = await this.formsRepository.findAndCount({
      where: where.length > 1 ? where : where[0],
      relations: ['branch', 'branch.business', 'creator'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { items, total };
  }

  async setAdminDisabledStatus(id: string, isDisabled: boolean, note?: string) {
    const form = await this.formsRepository.findOneBy({ id });
    if (!form) throw new NotFoundException('Form not found');
    form.adminDisabled = isDisabled;
    if (isDisabled && note) {
      form.adminDisabledNote = note;
    } else if (!isDisabled) {
      form.adminDisabledNote = null as any;
    }
    return this.formsRepository.save(form);
  }

  // Visitor actions
  async getFormsForVisitor(branchId: string): Promise<Form[]> {
    return this.formsRepository.find({
      where: {
        branchId,
        isPublished: true,
        isActive: true,
        adminDisabled: false,
      },
      relations: ['branch'],
    });
  }

  async getFormsByDeviceCode(deviceCode: string): Promise<Form[]> {
    const device = await this.devicesService.findByCode(deviceCode);
    if (!device) throw new NotFoundException('Device not found');
    if (!device.branchId)
      throw new BadRequestException('Device is not linked to any branch');

    return this.formsRepository.find({
      where: {
        branchId: device.branchId,
        isPublished: true,
        isActive: true,
        adminDisabled: false,
        showAfterLeadCapture: true,
      },
      relations: ['fields', 'branch'],

      order: { createdAt: 'DESC' },
    });
  }

  async submitResponse(
    uniqueCode: string,
    visitorId: string | null,
    dto: SubmitFormResponseDto,
  ): Promise<FormResponse> {
    const isUuid =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
        uniqueCode,
      );
    const where: FindOptionsWhere<Form>[] = [
      { uniqueCode, isPublished: true, isActive: true, adminDisabled: false },
    ];

    if (isUuid) {
      where.push({
        id: uniqueCode,
        isPublished: true,
        isActive: true,
        adminDisabled: false,
      });
    }

    const form = await this.formsRepository.findOne({ where });
    if (!form) throw new NotFoundException('Form not found');

    if (form.requiresAuth && !visitorId) {
      throw new UnauthorizedException('Authentication is required to submit this form');
    }

    const response = this.formResponsesRepository.create({
      formId: form.id,
      visitorId,
      branchId: form.branchId,
      businessId: form.businessId ?? undefined,
    });

    const savedResponse = await this.formResponsesRepository.save(response);

    // Increment response count on the form
    await this.formsRepository.increment({ id: form.id }, 'responseCount', 1);

    if (dto.answers && Array.isArray(dto.answers)) {
      const answers = dto.answers.map((ans) =>
        this.formAnswersRepository.create({
          responseId: savedResponse.id,
          fieldId: ans.fieldId,
          value: ans.value,
        }),
      );
      await this.formAnswersRepository.save(answers);
      savedResponse.answers = answers;
    }

    return savedResponse;
  }

  async updateBranchSettings(
    branchId: string,
    dto: UpdateBranchFormSettingsDto,
  ): Promise<Branch> {
    const branch = await this.branchesRepository.findOneBy({ id: branchId });
    if (!branch) throw new NotFoundException('Branch not found');

    const updateFields = { ...dto };

    Object.assign(branch, updateFields);
    return this.branchesRepository.save(branch);
  }
}
