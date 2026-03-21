import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
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
import { AdminFormQueryDto } from './dto/admin-form.dto';
import { ParseUUIDPipe } from '@nestjs/common';

@ApiTags('Admin Forms')
@ApiBearerAuth()
@Controller('admin-forms')
@Roles(UserRole.ADMIN)
export class AdminFormsController {
  constructor(private readonly formsService: FormsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all forms across the platform' })
  async findAll(@Query() query: AdminFormQueryDto) {
    return this.formsService.findAllForAdmin(query);
  }

  @Patch(':id/disable')
  @ApiOperation({ summary: 'Disable a specific form as an admin' })
  @ApiResponse({
    status: 200,
    description: 'The form has been successfully disabled.',
  })
  disableForm(@Param('id', ParseUUIDPipe) id: string) {
    return this.formsService.setAdminDisabledStatus(id, true);
  }

  @Patch(':id/enable')
  @ApiOperation({ summary: 'Re-enable a specific form as an admin' })
  @ApiResponse({
    status: 200,
    description: 'The form has been successfully enabled.',
  })
  enableForm(@Param('id', ParseUUIDPipe) id: string) {
    return this.formsService.setAdminDisabledStatus(id, false);
  }
}
