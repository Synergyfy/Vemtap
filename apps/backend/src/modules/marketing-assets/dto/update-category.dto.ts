import { PartialType } from '@nestjs/swagger';
import { CreateMarketingCategoryDto } from './create-category.dto';

export class UpdateMarketingCategoryDto extends PartialType(
  CreateMarketingCategoryDto,
) {}
