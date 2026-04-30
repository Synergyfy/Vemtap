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
  Request,
} from '@nestjs/common';
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
  ToggleUblFeatureDto
} from './dto/qr-thrive.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, User } from '../users/entities/user.entity';

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
  async syncUser(@Request() req: RequestWithUser) {
    return this.qrThriveService.syncUser(req.user);
  }

  @Post('branches/:branchId/qr-codes')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new QR code for a branch' })
  async createQRCode(
    @Request() req: RequestWithUser,
    @Param('branchId') branchId: string,
    @Body() dto: CreateQRCodeDto,
  ) {
    return this.qrThriveService.createQRCode(req.user, branchId, dto);
  }

  @Get('branches/:branchId/qr-codes')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'List all QR codes for a branch' })
  async getQRCodes(
    @Request() req: RequestWithUser,
    @Param('branchId') branchId: string,
  ) {
    return this.qrThriveService.getQRCodes(req.user, branchId);
  }

  @Get('branches/:branchId/qr-codes/:qrCodeId')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get a single QR code detail' })
  async getQRCode(
    @Request() req: RequestWithUser,
    @Param('branchId') branchId: string,
    @Param('qrCodeId') qrCodeId: string,
  ) {
    return this.qrThriveService.getQRCode(req.user, branchId, qrCodeId);
  }

  @Put('branches/:branchId/qr-codes/:qrCodeId')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update an existing QR code' })
  async updateQRCode(
    @Request() req: RequestWithUser,
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
    @Request() req: RequestWithUser,
    @Param('branchId') branchId: string,
    @Param('qrCodeId') qrCodeId: string,
  ) {
    return this.qrThriveService.deleteQRCode(req.user, branchId, qrCodeId);
  }

  @Post('branches/:branchId/qr-codes/:qrCodeId/duplicate')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Duplicate an existing QR code' })
  async duplicateQRCode(
    @Request() req: RequestWithUser,
    @Param('branchId') branchId: string,
    @Param('qrCodeId') qrCodeId: string,
  ) {
    return this.qrThriveService.duplicateQRCode(req.user, branchId, qrCodeId);
  }

  @Patch('branches/:branchId/qr-codes/:qrCodeId')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update QR code status (active/archived)' })
  async setStatus(
    @Request() req: RequestWithUser,
    @Param('branchId') branchId: string,
    @Param('qrCodeId') qrCodeId: string,
    @Body() dto: { status: 'active' | 'archived' },
  ) {
    return this.qrThriveService.updateQRCode(req.user, branchId, qrCodeId, dto);
  }

  @Patch('branches/:branchId/qr-codes/:qrCodeId/ubl')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Toggle whether a QR code is featured on the branch UBL profile' })
  async toggleUblFeature(
    @Request() req: RequestWithUser,
    @Param('branchId') branchId: string,
    @Param('qrCodeId') qrCodeId: string,
    @Body() dto: ToggleUblFeatureDto,
  ) {
    return this.qrThriveService.toggleUblFeature(req.user, branchId, qrCodeId, dto.isFeatured);
  }

  @Get('branches/:branchId/stats')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get QR-Thrive dashboard statistics' })
  async getStats(
    @Request() req: RequestWithUser,
    @Param('branchId') branchId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.qrThriveService.getStats(req.user, branchId, startDate, endDate);
  }

  // --- Folder Management ---

  @Get('branches/:branchId/folders')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async getFolders(@Request() req: RequestWithUser, @Param('branchId') branchId: string) {
    return this.qrThriveService.getFolders(req.user, branchId);
  }

  @Post('branches/:branchId/folders')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async createFolder(@Request() req: RequestWithUser, @Param('branchId') branchId: string, @Body() dto: CreateFolderDto) {
    return this.qrThriveService.createFolder(req.user, branchId, dto);
  }

  @Delete('branches/:branchId/folders/:folderId')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async deleteFolder(
    @Request() req: RequestWithUser, 
    @Param('branchId') branchId: string, 
    @Param('folderId') folderId: string
  ) {
    return this.qrThriveService.deleteFolder(req.user, branchId, folderId);
  }

  @Put('branches/:branchId/folders/:folderId')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async updateFolder(
    @Request() req: RequestWithUser, 
    @Param('branchId') branchId: string, 
    @Param('folderId') folderId: string,
    @Body() dto: UpdateFolderDto
  ) {
    return this.qrThriveService.updateFolder(req.user, branchId, folderId, dto);
  }

  @Get('branches/:branchId/qr-codes/:qrCodeId/scans')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get scan analytics for a specific QR code' })
  async getScans(
    @Request() req: RequestWithUser,
    @Param('branchId') branchId: string,
    @Param('qrCodeId') qrCodeId: string,
  ) {
    return this.qrThriveService.getScans(req.user, branchId, qrCodeId);
  }

  @Get('branches/:branchId/qr-codes/:qrCodeId/responses')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get form responses for a specific QR code' })
  async getResponses(
    @Request() req: RequestWithUser,
    @Param('branchId') branchId: string,
    @Param('qrCodeId') qrCodeId: string,
  ) {
    return this.qrThriveService.getResponses(req.user, branchId, qrCodeId);
  }

  @Get('branches/:branchId/leads')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get all leads for a branch',
    description: 'Fetches all form submission leads across every QR code owned by the current user via QR-Thrive.',
  })
  @ApiResponse({ status: 200, description: 'List of lead submissions returned successfully.' })
  @ApiResponse({ status: 400, description: 'User not synced with QR-Thrive.' })
  @ApiResponse({ status: 403, description: 'No access to this branch.' })
  async getLeads(
    @Request() req: RequestWithUser,
    @Param('branchId') branchId: string,
  ) {
    return this.qrThriveService.getLeads(req.user, branchId);
  }

  @Get('sso')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get magic link for QR-Thrive dashboard SSO' })
  async getMagicLink(@Request() req: RequestWithUser) {
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
  async resetMapping(@Request() req: RequestWithUser) {
    return this.qrThriveService.resetMapping(req.user.id);
  }
}
