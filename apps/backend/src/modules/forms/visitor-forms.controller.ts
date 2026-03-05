import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { FormsService } from './forms.service';
import { SubmitFormResponseDto } from './dto/submit-form-response.dto';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Visitor Forms')
@ApiBearerAuth()
@Controller('visitor-forms')
export class VisitorFormsController {
  constructor(private readonly formsService: FormsService) {}

  @Get('business/:businessId')
  @ApiOperation({
    summary: 'Get all active forms for a specific business/branch',
  })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Return all available forms.' })
  findForms(
    @Param('businessId') businessId: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.formsService.getFormsForVisitor(businessId, branchId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific form with its questions' })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Return the form with fields to answer.',
  })
  findOne(@Param('id') id: string, @Query('branchId') branchId?: string) {
    return this.formsService.getFormByIdForVisitor(id, branchId);
  }

  @Post(':id/responses')
  @ApiOperation({ summary: 'Submit answers for a specific form' })
  @ApiResponse({
    status: 201,
    description: 'Form response successfully submitted.',
  })
  submitResponse(
    @Request() req,
    @Param('id') id: string,
    @Body() submitResponseDto: SubmitFormResponseDto,
  ) {
    const visitorId = req.user.id; // Authenticated visitor ID
    return this.formsService.submitResponse(id, visitorId, submitResponseDto);
  }
}
