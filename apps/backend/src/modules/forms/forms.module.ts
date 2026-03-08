import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormsService } from './forms.service';
import { FormsController } from './forms.controller';
import { VisitorFormsController } from './visitor-forms.controller';
import { AdminFormsController } from './admin-forms.controller';
import { FormTemplatesController } from './form-templates.controller';
import { Form } from './entities/form.entity';
import { FormField } from './entities/form-field.entity';
import { FormResponse } from './entities/form-response.entity';
import { FormAnswer } from './entities/form-answer.entity';
import { FormTemplate } from './entities/form-template.entity';
import { FormFieldTemplate } from './entities/form-field-template.entity';
import { BranchesModule } from '../branches/branches.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Form,
      FormField,
      FormResponse,
      FormAnswer,
      FormTemplate,
      FormFieldTemplate,
    ]),
    BranchesModule,
  ],
  controllers: [
    FormsController,
    VisitorFormsController,
    AdminFormsController,
    FormTemplatesController,
  ],
  providers: [FormsService],
  exports: [FormsService],
})
export class FormsModule {}
