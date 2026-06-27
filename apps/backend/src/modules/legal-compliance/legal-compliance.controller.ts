import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { LegalComplianceService } from './legal-compliance.service';
import { AcceptAgreementDto } from './dto/accept-agreement.dto';
import { CreateAgreementDto, UpdateAgreementDto } from './dto/create-agreement.dto';
import {
  AgreementResponseDto,
  PaginatedAgreementHistoryDto,
} from './dto/agreement-response.dto';
import { LegalAgreement } from './entities/legal-agreement.entity';
import { LegalAgreementAcceptance } from './entities/legal-agreement-acceptance.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Legal Compliance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('legal-agreements')
export class LegalComplianceController {
  constructor(
    private readonly legalComplianceService: LegalComplianceService,
  ) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({
    summary: 'List all active legal agreements with current user acceptance status',
  })
  @ApiResponse({ type: [AgreementResponseDto], description: 'List of active agreements' })
  async findAll(
    @Req() req: any,
  ): Promise<AgreementResponseDto[]> {
    return this.legalComplianceService.findAll(req.user.id);
  }

  @Get(':slug')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get a single legal agreement by slug' })
  @ApiResponse({ type: LegalAgreement, description: 'Agreement details' })
  async findBySlug(@Param('slug') slug: string) {
    return this.legalComplianceService.findBySlug(slug);
  }

  @Get(':slug/acceptance')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({
    summary: "Get current user's acceptance record for an agreement",
  })
  @ApiResponse({ type: LegalAgreementAcceptance, description: 'Acceptance record or null' })
  async getAcceptance(
    @Param('slug') slug: string,
    @Req() req: any,
  ) {
    return this.legalComplianceService.getAcceptance(slug, req.user.id);
  }

  @Get(':slug/history')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get paginated acceptance history for an agreement scoped to the user business',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ type: PaginatedAgreementHistoryDto, description: 'Paginated acceptance history' })
  async getHistory(
    @Param('slug') slug: string,
    @Req() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PaginatedAgreementHistoryDto> {
    return this.legalComplianceService.getHistory(
      slug,
      req.user.businessId,
      page,
      limit,
    );
  }

  @Post(':slug/accept')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Accept a legal agreement' })
  @ApiResponse({ type: LegalAgreementAcceptance, description: 'Created acceptance record' })
  async accept(
    @Param('slug') slug: string,
    @Body() dto: AcceptAgreementDto,
    @Req() req: any,
  ) {
    const ipAddress: string =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ??
      req.socket?.remoteAddress ??
      req.ip;
    const userAgent = req.headers['user-agent'] as string | undefined;

    return this.legalComplianceService.accept(
      slug,
      req.user.id,
      ipAddress,
      userAgent,
      dto.signatureHash,
    );
  }

  // ─── Admin CRUD ───────────────────────────────────────────────────────────

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Create a new legal agreement' })
  @ApiResponse({ type: LegalAgreement, status: 201, description: 'Agreement created' })
  async create(@Body() dto: CreateAgreementDto) {
    return this.legalComplianceService.create(dto);
  }

  @Get('admin/all')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] List all agreements (including inactive)' })
  @ApiResponse({ type: [LegalAgreement], description: 'All agreements' })
  async findAllAdmin() {
    return this.legalComplianceService.findAllAdmin();
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Update a legal agreement' })
  @ApiResponse({ type: LegalAgreement, description: 'Updated agreement' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAgreementDto,
  ) {
    return this.legalComplianceService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Soft delete a legal agreement' })
  @ApiResponse({ status: 204, description: 'Agreement deleted' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.legalComplianceService.remove(id);
  }
}
