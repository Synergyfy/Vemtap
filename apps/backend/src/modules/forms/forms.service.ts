import {
  Injectable,
  NotFoundException,
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
import { SubmitFormResponseDto } from './dto/submit-form-response.dto';
import { BranchesService } from '../branches/branches.service';
import { User } from '../users/entities/user.entity';

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
    private readonly branchesService: BranchesService,
  ) {}

  async checkBranchAccess(user: User, branchId: string): Promise<boolean> {
    return this.branchesService.checkBranchAccess(user, branchId);
  }

  async createForm(branchId: string, dto: CreateFormDto): Promise<Form> {
    const branch = await this.branchesService.findById(branchId);
    const form = this.formsRepository.create({
      ...dto,
      branchId,
      businessId: branch.businessId,
    } as any) as unknown as Form;
    return this.formsRepository.save(form);
  }

  async getFormsByBranch(branchId: string): Promise<Form[]> {
    return this.formsRepository.find({
      where: { branchId },
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

  async updateForm(
    branchId: string,
    id: string,
    dto: UpdateFormDto,
  ): Promise<Form> {
    const form = await this.getFormById(branchId, id);
    Object.assign(form, dto);
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
      relations: ['answers', 'answers.field'],
      order: { createdAt: 'DESC' },
    });
  }

  // Admin Methods
  async findAllForAdmin(query: { branchId?: string }) {
    const where: any = {};
    if (query.branchId) where.branchId = query.branchId;
    return this.formsRepository.find({ where, relations: ['branch'] });
  }

  async setAdminDisabledStatus(id: string, isDisabled: boolean) {
    const form = await this.formsRepository.findOneBy({ id });
    if (!form) throw new NotFoundException('Form not found');
    (form as any).adminDisabled = isDisabled;
    return this.formsRepository.save(form);
  }

  // Visitor actions
  async getFormsForVisitor(branchId: string): Promise<Form[]> {
    return this.formsRepository.find({
      where: { branchId, isPublished: true, isActive: true },
    });
  }

  async getFormByIdForVisitor(id: string, branchId: string): Promise<Form> {
    const form = await this.formsRepository.findOne({
      where: { id, branchId, isPublished: true, isActive: true },
      relations: ['fields'],
    });

    if (!form) throw new NotFoundException('Form not available');
    return form;
  }

  async submitResponse(
    formId: string,
    visitorId: string,
    dto: SubmitFormResponseDto,
  ): Promise<FormResponse> {
    const form = await this.formsRepository.findOneBy({ id: formId });
    if (!form) throw new NotFoundException('Form not found');

    const savedResponseResult = await this.formResponsesRepository.save(
      this.formResponsesRepository.create({
        formId,
        visitorId,
        branchId: form.branchId,
        businessId: (form as any).businessId,
      } as any) as unknown as FormResponse,
    );

    const savedResponse = (
      Array.isArray(savedResponseResult)
        ? savedResponseResult[0]
        : savedResponseResult
    ) as FormResponse;

    if (dto.answers && Array.isArray(dto.answers)) {
      const answers = dto.answers.map((ans: any) =>
        this.formAnswersRepository.create({
          responseId: savedResponse.id,
          fieldId: ans.fieldId,
          value: ans.value,
        }),
      );
      await this.formAnswersRepository.save(answers);
      (savedResponse as any).answers = answers;
    }

    return savedResponse;
  }
}
