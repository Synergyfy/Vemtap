import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormsService } from './forms.service';
import { FormsController } from './forms.controller';
import { VisitorFormsController } from './visitor-forms.controller';
import { Form } from './entities/form.entity';
import { FormField } from './entities/form-field.entity';
import { FormResponse } from './entities/form-response.entity';
import { FormAnswer } from './entities/form-answer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Form, FormField, FormResponse, FormAnswer]),
  ],
  controllers: [FormsController, VisitorFormsController],
  providers: [FormsService],
  exports: [FormsService],
})
export class FormsModule {}
