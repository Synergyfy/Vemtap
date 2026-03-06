import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { FormsService } from './forms.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Admin Forms')
@ApiBearerAuth()
@Controller('admin-forms')
@Roles(UserRole.ADMIN)
export class AdminFormsController {
  constructor(private readonly formsService: FormsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all forms across the platform' })
  @ApiQuery({ name: 'businessId', required: false, type: String })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Return all forms array based on filters.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'uuid-form-1234' },
          title: { type: 'string', example: 'Customer Feedback' },
          businessId: { type: 'string', example: 'uuid-business-1234' },
          branchId: { type: 'string', example: 'uuid-branch-1234' },
          isActive: { type: 'boolean', example: true },
          isPublished: { type: 'boolean', example: true },
          adminDisabled: { type: 'boolean', example: false },
        },
      },
    },
  })
  findAll(
    @Query('businessId') businessId?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.formsService.findAllForAdmin({ businessId, branchId });
  }

  @Patch(':id/disable')
  @ApiOperation({ summary: 'Disable a specific form as an admin' })
  @ApiResponse({
    status: 200,
    description: 'The form has been successfully disabled.',
  })
  disableForm(@Param('id') id: string) {
    return this.formsService.setAdminDisabledStatus(id, true);
  }

  @Patch(':id/enable')
  @ApiOperation({ summary: 'Re-enable a specific form as an admin' })
  @ApiResponse({
    status: 200,
    description: 'The form has been successfully enabled.',
  })
  enableForm(@Param('id') id: string) {
    return this.formsService.setAdminDisabledStatus(id, false);
  }
}
