import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
} from '@nestjs/common';
import { FormsService } from './forms.service';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Business Forms')
@ApiBearerAuth()
@Controller('business-forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new form for the current business' })
  @ApiResponse({
    status: 201,
    description: 'The form has been successfully created.',
  })
  create(@Request() req, @Body() createFormDto: CreateFormDto) {
    return this.formsService.createForm(req.user.businessId, createFormDto);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get all forms for the current business' })
  @ApiResponse({ status: 200, description: 'Return all forms array.' })
  findAll(@Request() req) {
    return this.formsService.getFormsByBusiness(req.user.businessId);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get a specific form by ID' })
  @ApiResponse({ status: 200, description: 'Return the form with its fields.' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.formsService.getFormById(req.user.businessId, id);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update a specific form by ID' })
  @ApiResponse({
    status: 200,
    description: 'The form has been successfully updated.',
  })
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateFormDto: UpdateFormDto,
  ) {
    return this.formsService.updateForm(req.user.businessId, id, updateFormDto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete a specific form by ID' })
  @ApiResponse({
    status: 200,
    description: 'The form has been successfully deleted.',
  })
  remove(@Request() req, @Param('id') id: string) {
    return this.formsService.deleteForm(req.user.businessId, id);
  }

  @Get(':id/responses')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get all responses for a specific form' })
  @ApiResponse({ status: 200, description: 'Return all form responses.' })
  findResponses(@Request() req, @Param('id') id: string) {
    return this.formsService.getFormResponses(req.user.businessId, id);
  }
}
