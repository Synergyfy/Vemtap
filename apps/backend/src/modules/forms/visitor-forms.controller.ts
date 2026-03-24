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
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

interface RequestWithUser extends Request {
  user: User;
}

@ApiTags('Visitor Forms')
@ApiBearerAuth()
@Controller('visitor-forms')
export class VisitorFormsController {
  constructor(private readonly formsService: FormsService) {}

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
  @ApiOperation({
    summary:
      'Get a specific form by its unique 9-digit code with its questions',
  })
  @ApiResponse({
    status: 200,
    description: 'Return the form with fields to answer.',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'uuid-form-1234' },
        uniqueCode: { type: 'string', example: 'ABC123XYZ' },
        title: { type: 'string', example: 'Customer Feedback' },
        description: {
          type: 'string',
          example: 'Let us know how your visit went',
        },
        fields: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'uuid-field-1234' },
              type: { type: 'string', example: 'radio' },
              question: {
                type: 'string',
                example: 'How would you rate our service?',
              },
              options: {
                type: 'array',
                items: { type: 'string' },
                example: ['1', '2', '3', '4', '5'],
              },
              isRequired: { type: 'boolean', example: true },
              order: { type: 'number', example: 1 },
            },
          },
        },
      },
    },
  })
  getFormByCode(@Param('code') code: string) {
    return this.formsService.getFormByUniqueCode(code);
  }

  @Public()
  @Get('device/:code')
  @ApiOperation({
    summary: 'Get all forms to show after lead capture for a device',
    description:
      'Retrieves active, published forms for the branch linked to the device that have showAfterLeadCapture enabled.',
  })
  @ApiResponse({
    status: 200,
    description: 'Return forms with fields.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'uuid-form-1234' },
          uniqueCode: { type: 'string', example: 'ABC123XYZ' },
          title: { type: 'string', example: 'Post-Visit Survey' },
          description: { type: 'string', example: 'Please help us improve' },
          fields: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'uuid-field-1234' },
                type: { type: 'string', example: 'text' },
                question: {
                  type: 'string',
                  example: 'Any additional comments?',
                },
                isRequired: { type: 'boolean', example: false },
                order: { type: 'number', example: 1 },
              },
            },
          },
        },
      },
    },
  })
  getFormsByDeviceCode(@Param('code') code: string) {
    return this.formsService.getFormsByDeviceCode(code);
  }

  @Post(':code/responses')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({
    summary: 'Submit answers for a specific form using its unique code',
  })
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
