import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Survey } from './entities/survey.entity';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { UpdateSurveyDto } from './dto/update-survey.dto';

@Injectable()
export class SurveysService {
  constructor(
    @InjectRepository(Survey)
    private surveysRepository: Repository<Survey>,
  ) {}

  async findByBusiness(businessId: string): Promise<Survey | null> {
    return this.surveysRepository.findOne({ where: { businessId } });
  }

  async createOrUpdate(
    businessId: string,
    dto: CreateSurveyDto | UpdateSurveyDto,
  ): Promise<Survey> {
    let survey = await this.findByBusiness(businessId);
    if (survey) {
      Object.assign(survey, dto);
    } else {
      survey = this.surveysRepository.create({ ...dto, businessId });
    }
    return this.surveysRepository.save(survey);
  }
}
