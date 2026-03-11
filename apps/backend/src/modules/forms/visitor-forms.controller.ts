import {
  Get,
  Post,
  Body,
  Param,
  Query,
  Request,
  BadRequestException,
  Controller,
} from '@nestjs/common';
import { FormsService } from './forms.service';
import { SubmitFormResponseDto } from './dto/submit-form-response.dto';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { User, UserRole } from '../users/entities/user.entity';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Public } from 'src/common/decorators/public.decorator';

interface RequestWithUser extends Request {
  user: User;
}

@ApiTags('Visitor Forms')
@ApiBearerAuth()
@Controller('visitor-forms')
export class VisitorFormsController {
  constructor(private readonly formsService: FormsService) { }

  @Public()
  @Get('branch/:branchId')
  @ApiOperation({
    summary: 'Get all active forms for a specific branch',
  })
  @ApiResponse({
    status: 200,
    description: 'Return all available forms.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'uuid-form-1234' },
          uniqueCode: { type: 'string', example: 'ABC123XYZ' },
          title: { type: 'string', example: 'Customer Feedback' },
          description: {
            type: 'string',
            example: 'Let us know how your visit went',
          },
          isActive: { type: 'boolean', example: true },
          isPublished: { type: 'boolean', example: true },
        },
      },
    },
  })
  findForms(@Param('branchId') branchId: string) {
    return this.formsService.getFormsForVisitor(branchId);
  }



  @Public()
  @Get('code/:code')
  @ApiOperation({ summary: 'Get a specific form by its unique 9-digit code with its questions' })
  @ApiResponse({
    status: 200,
    description: 'Return the form with fields to answer.',
  })
  getFormByCode(@Param('code') code: string) {
    return this.formsService.getFormByUniqueCode(code);
  }

  @Post(':code/responses')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Submit answers for a specific form using its unique code' })
  @ApiBody({
    type: SubmitFormResponseDto,
    examples: {
      default: {
        summary: 'Sample response payload',
        value: {
          branchId: 'uuid-branch-1234',
          answers: [
            {
              fieldId: 'uuid-field-1234',
              value: '5',
            },
            {
              fieldId: 'uuid-field-5678',
              value: 'It was a great visit.',
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Form response successfully submitted.',
  })
  submitResponse(
    @Request() req: RequestWithUser,
    @Param('code') code: string,
    @Body() submitResponseDto: SubmitFormResponseDto,
  ) {
    const visitorId = req.user.id;
    return this.formsService.submitResponse(code, visitorId, submitResponseDto);
  }
}
