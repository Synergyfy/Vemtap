import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { MessagingAutomationsService } from './messaging-automations.service';
import { CreateAutomationRuleDto, UpdateAutomationRuleDto } from './dto/automation-rule.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Messaging Automations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('automations')
export class AutomationRuleController {
  constructor(private readonly service: MessagingAutomationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all automation rules for the business' })
  findAll(@Request() req: any, @Query('branchId') branchId?: string) {
    return this.service.findAllRules(req.user.businessId, branchId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new automation rule' })
  create(@Request() req: any, @Body() dto: CreateAutomationRuleDto) {
    return this.service.createRule(req.user.businessId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an automation rule' })
  update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: UpdateAutomationRuleDto,
  ) {
    return this.service.updateRule(id, req.user.businessId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an automation rule' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.deleteRule(id, req.user.businessId);
  }
}
