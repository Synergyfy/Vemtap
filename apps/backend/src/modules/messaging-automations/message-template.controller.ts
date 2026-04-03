import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { MessagingAutomationsService } from './messaging-automations.service';
import { CreateMessageTemplateDto, UpdateMessageTemplateDto } from './dto/message-template.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Message Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messaging/templates')
export class MessageTemplateController {
  constructor(private readonly service: MessagingAutomationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all message templates' })
  findAll(@Request() req: any, @Query('branchId') branchId?: string) {
    return this.service.findAllTemplates(req.user.businessId, branchId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new message template' })
  create(@Request() req: any, @Body() dto: CreateMessageTemplateDto) {
    return this.service.createTemplate(req.user.businessId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a message template' })
  update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: UpdateMessageTemplateDto,
  ) {
    return this.service.updateTemplate(id, req.user.businessId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a message template' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.deleteTemplate(id, req.user.businessId);
  }
}
