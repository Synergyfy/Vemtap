import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FosConfigService } from './fos-config.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { FosEnvelope } from '../../common/decorators/fos-envelope.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateAccountDto,
  UpdateAccountDto,
  CreatePeriodDto,
  UpdatePeriodDto,
  CreateCurrencyDto,
  UpdateCurrencyDto,
  UpdatePermissionsDto,
  CreateApprovalRuleDto,
  UpdateApprovalRuleDto,
  CreateNotificationRuleDto,
  UpdateNotificationRuleDto,
  ListAuditLogsQueryDto,
} from './dto/fos-config.dto';

@ApiTags('FOS Settings Config')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@FosEnvelope()
@Controller('settings')
export class FosConfigController {
  constructor(private readonly configService: FosConfigService) {}

  // ---- Categories ----

  @Get('categories')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List income/expense categories' })
  async listCategories() {
    return this.configService.listCategories();
  }

  @Post('categories')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a category' })
  async createCategory(
    @Body() dto: CreateCategoryDto,
    @Request() req: { user?: User },
  ) {
    const result = await this.configService.createCategory(dto);
    await this.configService.log(
      this.userName(req.user),
      'Category Created',
      `Created category "${result.name}"`,
    );
    return result;
  }

  @Patch('categories/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a category' })
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @Request() req: { user?: User },
  ) {
    const result = await this.configService.updateCategory(id, dto);
    await this.configService.log(
      this.userName(req.user),
      'Category Updated',
      `Updated category "${result.name}"`,
    );
    return result;
  }

  @Delete('categories/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a category' })
  async removeCategory(
    @Param('id') id: string,
    @Request() req: { user?: User },
  ) {
    const result = await this.configService.removeCategory(id);
    await this.configService.log(
      this.userName(req.user),
      'Category Deleted',
      `Deleted category ${id}`,
    );
    return result;
  }

  // ---- Chart of Accounts ----

  @Get('accounts')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List chart of accounts' })
  async listAccounts() {
    return this.configService.listAccounts();
  }

  @Post('accounts')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create an account' })
  async createAccount(
    @Body() dto: CreateAccountDto,
    @Request() req: { user?: User },
  ) {
    const result = await this.configService.createAccount(dto);
    await this.configService.log(
      this.userName(req.user),
      'Account Created',
      `Created account "${result.name}"`,
    );
    return result;
  }

  @Patch('accounts/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update an account' })
  async updateAccount(
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto,
    @Request() req: { user?: User },
  ) {
    const result = await this.configService.updateAccount(id, dto);
    await this.configService.log(
      this.userName(req.user),
      'Account Updated',
      `Updated account "${result.name}"`,
    );
    return result;
  }

  @Delete('accounts/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete an account' })
  async removeAccount(
    @Param('id') id: string,
    @Request() req: { user?: User },
  ) {
    const result = await this.configService.removeAccount(id);
    await this.configService.log(
      this.userName(req.user),
      'Account Deleted',
      `Deleted account ${id}`,
    );
    return result;
  }

  // ---- Fiscal Periods ----

  @Get('periods')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List fiscal periods' })
  async listPeriods() {
    return this.configService.listPeriods();
  }

  @Post('periods')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a fiscal period' })
  async createPeriod(
    @Body() dto: CreatePeriodDto,
    @Request() req: { user?: User },
  ) {
    const result = await this.configService.createPeriod(dto);
    await this.configService.log(
      this.userName(req.user),
      'Period Created',
      `Created period "${result.name}"`,
    );
    return result;
  }

  @Patch('periods/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a fiscal period' })
  async updatePeriod(
    @Param('id') id: string,
    @Body() dto: UpdatePeriodDto,
    @Request() req: { user?: User },
  ) {
    const result = await this.configService.updatePeriod(id, dto);
    await this.configService.log(
      this.userName(req.user),
      'Period Updated',
      `Updated period "${result.name}"`,
    );
    return result;
  }

  @Delete('periods/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a fiscal period' })
  async removePeriod(@Param('id') id: string, @Request() req: { user?: User }) {
    const result = await this.configService.removePeriod(id);
    await this.configService.log(
      this.userName(req.user),
      'Period Deleted',
      `Deleted period ${id}`,
    );
    return result;
  }

  // ---- Currencies ----

  @Get('currencies')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List currencies' })
  async listCurrencies() {
    return this.configService.listCurrencies();
  }

  @Post('currencies')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a currency' })
  async createCurrency(
    @Body() dto: CreateCurrencyDto,
    @Request() req: { user?: User },
  ) {
    const result = await this.configService.createCurrency(dto);
    await this.configService.log(
      this.userName(req.user),
      'Currency Created',
      `Created currency "${result.code}"`,
    );
    return result;
  }

  @Patch('currencies/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a currency' })
  async updateCurrency(
    @Param('id') id: string,
    @Body() dto: UpdateCurrencyDto,
    @Request() req: { user?: User },
  ) {
    const result = await this.configService.updateCurrency(id, dto);
    await this.configService.log(
      this.userName(req.user),
      'Currency Updated',
      `Updated currency "${result.code}"`,
    );
    return result;
  }

  @Delete('currencies/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a currency' })
  async removeCurrency(
    @Param('id') id: string,
    @Request() req: { user?: User },
  ) {
    const result = await this.configService.removeCurrency(id);
    await this.configService.log(
      this.userName(req.user),
      'Currency Deleted',
      `Deleted currency ${id}`,
    );
    return result;
  }

  // ---- Permissions ----

  @Get('permissions')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get role permissions map' })
  async getPermissions() {
    return this.configService.getPermissions();
  }

  @Put('permissions')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Replace the whole role→permissions map' })
  async updatePermissions(
    @Body() dto: UpdatePermissionsDto,
    @Request() req: { user?: User },
  ) {
    const result = await this.configService.updatePermissions(dto);
    await this.configService.log(
      this.userName(req.user),
      'Permissions Updated',
      'Updated role permissions map',
    );
    return result;
  }

  // ---- Approval Rules ----

  @Get('approval-rules')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List approval rules' })
  async listApprovalRules() {
    return this.configService.listApprovalRules();
  }

  @Post('approval-rules')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create an approval rule' })
  async createApprovalRule(
    @Body() dto: CreateApprovalRuleDto,
    @Request() req: { user?: User },
  ) {
    const result = await this.configService.createApprovalRule(dto);
    await this.configService.log(
      this.userName(req.user),
      'Approval Rule Created',
      `Created rule "${result.name}"`,
    );
    return result;
  }

  @Patch('approval-rules/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update an approval rule' })
  async updateApprovalRule(
    @Param('id') id: string,
    @Body() dto: UpdateApprovalRuleDto,
    @Request() req: { user?: User },
  ) {
    const result = await this.configService.updateApprovalRule(id, dto);
    await this.configService.log(
      this.userName(req.user),
      'Approval Rule Updated',
      `Updated rule "${result.name}"`,
    );
    return result;
  }

  @Delete('approval-rules/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete an approval rule' })
  async removeApprovalRule(
    @Param('id') id: string,
    @Request() req: { user?: User },
  ) {
    const result = await this.configService.removeApprovalRule(id);
    await this.configService.log(
      this.userName(req.user),
      'Approval Rule Deleted',
      `Deleted approval rule ${id}`,
    );
    return result;
  }

  // ---- Notification Rules ----

  @Get('notification-rules')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List notification rules' })
  async listNotificationRules() {
    return this.configService.listNotificationRules();
  }

  @Post('notification-rules')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a notification rule' })
  async createNotificationRule(
    @Body() dto: CreateNotificationRuleDto,
    @Request() req: { user?: User },
  ) {
    const result = await this.configService.createNotificationRule(dto);
    await this.configService.log(
      this.userName(req.user),
      'Notification Rule Created',
      `Created rule "${result.event}"`,
    );
    return result;
  }

  @Patch('notification-rules/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a notification rule' })
  async updateNotificationRule(
    @Param('id') id: string,
    @Body() dto: UpdateNotificationRuleDto,
    @Request() req: { user?: User },
  ) {
    const result = await this.configService.updateNotificationRule(id, dto);
    await this.configService.log(
      this.userName(req.user),
      'Notification Rule Updated',
      `Updated rule "${result.event}"`,
    );
    return result;
  }

  @Delete('notification-rules/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a notification rule' })
  async removeNotificationRule(
    @Param('id') id: string,
    @Request() req: { user?: User },
  ) {
    const result = await this.configService.removeNotificationRule(id);
    await this.configService.log(
      this.userName(req.user),
      'Notification Rule Deleted',
      `Deleted notification rule ${id}`,
    );
    return result;
  }

  // ---- Audit Logs ----

  @Get('audit-logs')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List server-generated audit logs' })
  async listAuditLogs(@Query() query: ListAuditLogsQueryDto) {
    return this.configService.listAuditLogs(query);
  }

  private userName(user?: User): string {
    if (!user) return 'Unknown User';
    return (
      `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
    );
  }
}
