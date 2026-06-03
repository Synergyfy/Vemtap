import { PartialType } from '@nestjs/swagger';
import { CreateTemplateStyleDto } from './create-template-style.dto';

export class UpdateTemplateStyleDto extends PartialType(CreateTemplateStyleDto) {}
