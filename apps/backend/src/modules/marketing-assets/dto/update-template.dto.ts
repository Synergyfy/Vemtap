import { PartialType } from '@nestjs/swagger';
import { CreateMarketingTemplateDto } from './create-template.dto';

export class UpdateMarketingTemplateDto extends PartialType(
  CreateMarketingTemplateDto,
) {}
