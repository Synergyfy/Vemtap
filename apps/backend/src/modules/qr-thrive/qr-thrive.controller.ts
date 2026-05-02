import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { QrThriveService } from './qr-thrive.service';
import {
  CreateQRCodeDto,
  UpdateQRCodeDto,
  CreateFolderDto,
  UpdateFolderDto,
  ToggleUblFeatureDto,
  SpecializedLeadsQueryDto,
} from './dto/qr-thrive.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, User } from '../users/entities/user.entity';
import { Public } from '../../common/decorators/public.decorator';

interface RequestWithUser extends Request {
  user: User;
}

@ApiTags('qr-thrive')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('qr-thrive')
export class QrThriveController {
  constructor(private readonly qrThriveService: QrThriveService) {}

  @Post('sync')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Sync current user with QR-Thrive' })
  async syncUser(@Req() req: RequestWithUser) {
    return this.qrThriveService.syncUser(req.user);
  }

  @Post('branches/:branchId/qr-codes')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new QR code for a branch' })
  async createQRCode(
    @Req() req: RequestWithUser,
    @Param('branchId') branchId: string,
    @Body() dto: CreateQRCodeDto,
  ) {
    return this.qrThriveService.createQRCode(req.user, branchId, dto);
  }

  @Get('branches/:branchId/qr-codes')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'List all QR codes for a branch' })
  async getQRCodes(
    @Req() req: RequestWithUser,
    @Param('branchId') branchId: string,
  ) {
    return this.qrThriveService.getQRCodes(req.user, branchId);
  }

  @Get('branches/:branchId/qr-codes/:qrCodeId')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get a single QR code detail' })
  async getQRCode(
    @Req() req: RequestWithUser,
    @Param('branchId') branchId: string,
    @Param('qrCodeId') qrCodeId: string,
  ) {
    return this.qrThriveService.getQRCode(req.user, branchId, qrCodeId);
  }

  @Put('branches/:branchId/qr-codes/:qrCodeId')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update an existing QR code' })
  async updateQRCode(
    @Req() req: RequestWithUser,
    @Param('branchId') branchId: string,
    @Param('qrCodeId') qrCodeId: string,
    @Body() dto: UpdateQRCodeDto,
  ) {
    return this.qrThriveService.updateQRCode(req.user, branchId, qrCodeId, dto);
  }

  @Delete('branches/:branchId/qr-codes/:qrCodeId')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete a QR code' })
  async deleteQRCode(
    @Req() req: RequestWithUser,
    @Param('branchId') branchId: string,
    @Param('qrCodeId') qrCodeId: string,
  ) {
    return this.qrThriveService.deleteQRCode(req.user, branchId, qrCodeId);
  }

  @Post('branches/:branchId/qr-codes/:qrCodeId/duplicate')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Duplicate an existing QR code' })
  async duplicateQRCode(
    @Req() req: RequestWithUser,
    @Param('branchId') branchId: string,
    @Param('qrCodeId') qrCodeId: string,
  ) {
    return this.qrThriveService.duplicateQRCode(req.user, branchId, qrCodeId);
  }

  @Patch('branches/:branchId/qr-codes/:qrCodeId')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update QR code status (active/archived)' })
  async setStatus(
    @Req() req: RequestWithUser,
    @Param('branchId') branchId: string,
    @Param('qrCodeId') qrCodeId: string,
    @Body() dto: { status: 'active' | 'archived' },
  ) {
    return this.qrThriveService.updateQRCode(req.user, branchId, qrCodeId, dto);
  }

  @Patch('branches/:branchId/qr-codes/:qrCodeId/ubl')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Toggle whether a QR code is featured on the branch UBL profile',
  })
  async toggleUblFeature(
    @Req() req: RequestWithUser,
    @Param('branchId') branchId: string,
    @Param('qrCodeId') qrCodeId: string,
    @Body() dto: ToggleUblFeatureDto,
  ) {
    return this.qrThriveService.toggleUblFeature(
      req.user,
      branchId,
      qrCodeId,
      dto.isFeatured,
    );
  }

  @Get('branches/:branchId/stats')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get QR-Thrive dashboard statistics' })
  async getStats(
    @Req() req: RequestWithUser,
    @Param('branchId') branchId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.qrThriveService.getStats(
      req.user,
      branchId,
      startDate,
      endDate,
    );
  }

  // --- Folder Management ---

  @Get('branches/:branchId/folders')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async getFolders(
    @Req() req: RequestWithUser,
    @Param('branchId') branchId: string,
  ) {
    return this.qrThriveService.getFolders(req.user, branchId);
  }

  @Post('branches/:branchId/folders')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async createFolder(
    @Req() req: RequestWithUser,
    @Param('branchId') branchId: string,
    @Body() dto: CreateFolderDto,
  ) {
    return this.qrThriveService.createFolder(req.user, branchId, dto);
  }

  @Delete('branches/:branchId/folders/:folderId')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async deleteFolder(
    @Req() req: RequestWithUser,
    @Param('branchId') branchId: string,
    @Param('folderId') folderId: string,
  ) {
    return this.qrThriveService.deleteFolder(req.user, branchId, folderId);
  }

  @Put('branches/:branchId/folders/:folderId')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async updateFolder(
    @Req() req: RequestWithUser,
    @Param('branchId') branchId: string,
    @Param('folderId') folderId: string,
    @Body() dto: UpdateFolderDto,
  ) {
    return this.qrThriveService.updateFolder(req.user, branchId, folderId, dto);
  }

  @Get('branches/:branchId/qr-codes/:qrCodeId/scans')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get scan analytics for a specific QR code' })
  async getScans(
    @Req() req: RequestWithUser,
    @Param('branchId') branchId: string,
    @Param('qrCodeId') qrCodeId: string,
  ) {
    return this.qrThriveService.getScans(req.user, branchId, qrCodeId);
  }

  @Get('branches/:branchId/qr-codes/:qrCodeId/responses')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get form responses for a specific QR code' })
  async getResponses(
    @Req() req: RequestWithUser,
    @Param('branchId') branchId: string,
    @Param('qrCodeId') qrCodeId: string,
  ) {
    return this.qrThriveService.getResponses(req.user, branchId, qrCodeId);
  }

  @Get('branches/:branchId/leads')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get all leads for a branch',
    description:
      'Fetches all form submission leads across every QR code owned by the current user via QR-Thrive.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of lead submissions returned successfully.',
  })
  @ApiResponse({ status: 400, description: 'User not synced with QR-Thrive.' })
  @ApiResponse({ status: 403, description: 'No access to this branch.' })
  async getLeads(
    @Req() req: RequestWithUser,
    @Param('branchId') branchId: string,
  ) {
    return this.qrThriveService.getLeads(req.user, branchId);
  }

  @Get('branches/:branchId/specialized-leads')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get specialized leads for a branch (bookings, menus)',
    description:
      'Fetches curated leads from QR-Thrive with support for filtering by type, QR code, and search.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of specialized leads returned successfully.',
  })
  async getSpecializedLeads(
    @Req() req: RequestWithUser,
    @Param('branchId') branchId: string,
    @Query() query: SpecializedLeadsQueryDto,
  ) {
    return this.qrThriveService.getSpecializedLeads(req.user, branchId, query);
  }

  @Get('sso')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get magic link for QR-Thrive dashboard SSO' })
  async getMagicLink(@Req() req: RequestWithUser) {
    return this.qrThriveService.getMagicLink(req.user.id);
  }

  @Get('plans')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get available plans from QR-Thrive' })
  async getPlans() {
    return this.qrThriveService.getPlans();
  }

  @Delete('me/mapping')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Reset QR-Thrive mapping for the current user' })
  async resetMapping(@Req() req: RequestWithUser) {
    return this.qrThriveService.resetMapping(req.user.id);
  }

  @Public()
  @Get('public/:shortId')
  @ApiOperation({ summary: 'Get public details of a QR code by short ID' })
  async getPublicQRCode(@Param('shortId') shortId: string) {
    return this.qrThriveService.getPublicQRCode(shortId);
  }

  @Public()
  @Get('scan/:shortId')
  @ApiOperation({ summary: 'Record a scan and redirect to destination' })
  async recordPublicScan(
    @Param('shortId') shortId: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    let ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    if (ip.includes(',')) {
      ip = ip.split(',')[0].trim();
    }
    const userAgent = req.headers['user-agent'] || 'unknown';
    const redirectUrl = await this.qrThriveService.recordPublicScan(shortId, ip, userAgent);
    return res.redirect(redirectUrl);
  }
}
