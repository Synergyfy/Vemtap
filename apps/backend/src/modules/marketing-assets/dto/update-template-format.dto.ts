import { PartialType } from '@nestjs/swagger';
import { CreateTemplateFormatDto } from './create-template-format.dto';

export class UpdateTemplateFormatDto extends PartialType(CreateTemplateFormatDto) {}
