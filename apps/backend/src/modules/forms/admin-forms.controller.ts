import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { FormsService } from './forms.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { AdminFormQueryDto } from './dto/admin-form.dto';
import { DisableFormDto } from './dto/disable-form.dto';
import { ParseUUIDPipe, Body } from '@nestjs/common';

@ApiTags('Admin Forms')
@ApiBearerAuth()
@Controller('admin-forms')
@Roles(UserRole.ADMIN)
export class AdminFormsController {
  constructor(private readonly formsService: FormsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all forms across the platform' })
  @ApiResponse({
    status: 200,
    description: 'Return list of forms with pagination and relations.',
    schema: {
      example: {
        items: [
          {
            id: 'uuid-form-1',
            title: 'Customer Feedback',
            responseCount: 15,
            branch: { name: 'Main Branch' },
            creator: { firstName: 'John', lastName: 'Doe' },
          },
        ],
        total: 1,
      },
    },
  })
  async findAll(@Query() query: AdminFormQueryDto) {
    return this.formsService.findAllForAdmin(query);
  }

  @Patch(':id/disable')
  @ApiOperation({ summary: 'Disable a specific form as an admin' })
  @ApiBody({ type: DisableFormDto })
  @ApiResponse({
    status: 200,
    description: 'The form has been successfully disabled.',
    schema: {
      example: {
        id: 'uuid-form-1',
        title: 'Customer Feedback',
        adminDisabled: true,
        adminDisabledNote: 'Violated terms of service'
      },
    },
  })
  disableForm(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DisableFormDto,
  ) {
    return this.formsService.setAdminDisabledStatus(id, true, dto.adminDisabledNote);
  }

  @Patch(':id/enable')
  @ApiOperation({ summary: 'Re-enable a specific form as an admin' })
  @ApiResponse({
    status: 200,
    description: 'The form has been successfully enabled.',
    schema: {
      example: {
        id: 'uuid-form-1',
        title: 'Customer Feedback',
        adminDisabled: false,
        adminDisabledNote: null,
      },
    },
  })
  enableForm(@Param('id', ParseUUIDPipe) id: string) {
    return this.formsService.setAdminDisabledStatus(id, false);
  }
}
