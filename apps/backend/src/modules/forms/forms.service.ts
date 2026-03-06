import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Form } from './entities/form.entity';
import { FormField } from './entities/form-field.entity';
import { FormResponse } from './entities/form-response.entity';
import { FormAnswer } from './entities/form-answer.entity';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import {
  SubmitFormResponseDto,
  FormAnswerDto,
} from './dto/submit-form-response.dto';

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
  ) {}

  async createForm(businessId: string, dto: CreateFormDto): Promise<Form> {
    const form = this.formsRepository.create({
      ...dto,
      businessId,
    });
    return this.formsRepository.save(form);
  }

  async getFormsByBusiness(
    businessId: string,
    branchId?: string,
  ): Promise<Form[]> {
    const where: any = { businessId };
    if (branchId) {
      where.branchId = branchId;
    }
    return this.formsRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async getFormById(businessId: string, id: string): Promise<Form> {
    const form = await this.formsRepository.findOne({
      where: { id, businessId },
      relations: ['fields'],
    });

    if (!form) {
      throw new NotFoundException(`Form with ID ${id} not found`);
    }

    return form;
  }

  async updateForm(
    businessId: string,
    id: string,
    dto: UpdateFormDto,
  ): Promise<Form> {
    const form = await this.getFormById(businessId, id);

    if (form.adminDisabled) {
      throw new ForbiddenException(
        'This form has been disabled by an administrator and cannot be modified.',
      );
    }

    if (dto.title !== undefined) form.title = dto.title;
    if (dto.description !== undefined) form.description = dto.description;
    if (dto.isActive !== undefined) form.isActive = dto.isActive;
    if (dto.isPublished !== undefined) form.isPublished = dto.isPublished;
    if (dto.branchId !== undefined) form.branchId = dto.branchId;

    if (dto.fields) {
      const responseCount = await this.formResponsesRepository.count({
        where: { formId: id },
      });
      if (responseCount > 0) {
        throw new BadRequestException(
          'Cannot update fields of a form that already has responses.',
        );
      }
      await this.formFieldsRepository.delete({ formId: id });
      form.fields = dto.fields.map((field) =>
        this.formFieldsRepository.create(field),
      );
    }

    return this.formsRepository.save(form);
  }

  async deleteForm(businessId: string, id: string): Promise<void> {
    const form = await this.getFormById(businessId, id);

    if (form.adminDisabled) {
      throw new ForbiddenException(
        'This form has been disabled by an administrator and cannot be deleted.',
      );
    }

    await this.formsRepository.remove(form);
  }

  async getFormResponses(
    businessId: string,
    id: string,
  ): Promise<FormResponse[]> {
    // Assert form belongs to business
    await this.getFormById(businessId, id);

    return this.formResponsesRepository.find({
      where: { formId: id },
      relations: ['answers', 'answers.field', 'visitor'],
      order: { createdAt: 'DESC' },
    });
  }

  // --- Admin Methods ---

  async findAllForAdmin(filters?: {
    businessId?: string;
    branchId?: string;
  }): Promise<Form[]> {
    const query = this.formsRepository.createQueryBuilder('form');

    if (filters?.businessId) {
      query.andWhere('form.businessId = :businessId', {
        businessId: filters.businessId,
      });
    }

    if (filters?.branchId) {
      query.andWhere('form.branchId = :branchId', {
        branchId: filters.branchId,
      });
    }

    return query.orderBy('form.createdAt', 'DESC').getMany();
  }

  async setAdminDisabledStatus(id: string, disabled: boolean): Promise<Form> {
    const form = await this.formsRepository.findOne({ where: { id } });
    if (!form) {
      throw new NotFoundException(`Form with ID ${id} not found`);
    }

    form.adminDisabled = disabled;

    if (disabled) {
      form.isActive = false;
      form.isPublished = false;
    }

    return this.formsRepository.save(form);
  }

  // --- Visitor Methods ---

  async getFormsForVisitor(
    businessId: string,
    branchId?: string,
  ): Promise<Form[]> {
    const query = this.formsRepository
      .createQueryBuilder('form')
      .where('form.isActive = :isActive', { isActive: true })
      .andWhere('form.isPublished = :isPublished', { isPublished: true })
      .andWhere('form.adminDisabled = :adminDisabled', { adminDisabled: false })
      .andWhere('form.businessId = :businessId', { businessId });

    if (branchId) {
      query.andWhere('(form.branchId IS NULL OR form.branchId = :branchId)', {
        branchId,
      });
    } else {
      query.andWhere('form.branchId IS NULL');
    }

    return query.getMany();
  }

  async getFormByIdForVisitor(
    formId: string,
    branchId?: string,
  ): Promise<Form> {
    const form = await this.formsRepository.findOne({
      where: {
        id: formId,
        isActive: true,
        isPublished: true,
        adminDisabled: false,
      },
      relations: ['fields'],
    });

    if (!form) {
      throw new NotFoundException(
        `Form not found, inactive, not published, or disabled by admin`,
      );
    }

    if (form.branchId && form.branchId !== branchId) {
      throw new ForbiddenException(`This form is specific to another branch`);
    }

    return form;
  }

  async submitResponse(
    formId: string,
    visitorId: string,
    dto: SubmitFormResponseDto,
  ): Promise<FormResponse> {
    const form = await this.getFormByIdForVisitor(formId, dto.branchId);

    // Validate required fields
    const requiredFields = form.fields.filter((f) => f.isRequired);
    for (const requiredField of requiredFields) {
      const answer = dto.answers.find((a) => a.fieldId === requiredField.id);
      if (!answer || !answer.value || answer.value.trim() === '') {
        throw new BadRequestException(
          `Field ${requiredField.question} is required`,
        );
      }
    }

    const response = this.formResponsesRepository.create({
      formId,
      visitorId,
      branchId: dto.branchId,
    });

    const savedResponse = await this.formResponsesRepository.save(response);

    const answers = dto.answers.map((ans) =>
      this.formAnswersRepository.create({
        responseId: savedResponse.id,
        fieldId: ans.fieldId,
        value: ans.value,
      }),
    );

    if (answers.length > 0) {
      await this.formAnswersRepository.save(answers);
    }

    savedResponse.answers = answers;
    return savedResponse;
  }
}
