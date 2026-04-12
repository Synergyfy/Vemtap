import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { QrThriveService } from './qr-thrive.service';
import { CreateQRCodeDto } from './dto/qr-thrive.dto';
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
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @Body() dto: CreateQRCodeDto,
  ) {
    return this.qrThriveService.createQRCode(req.user, branchId, dto);
  }

  @Get('branches/:branchId/qr-codes/:qrCodeId/scans')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get scan analytics for a specific QR code' })
  async getScans(
    @Request() req: RequestWithUser,
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @Param('qrCodeId') qrCodeId: string,
  ) {
    return this.qrThriveService.getScans(req.user, branchId, qrCodeId);
  }

  @Get('branches/:branchId/qr-codes/:qrCodeId/responses')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get form responses for a specific QR code' })
  async getResponses(
    @Request() req: RequestWithUser,
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @Param('qrCodeId') qrCodeId: string,
  ) {
    return this.qrThriveService.getResponses(req.user, branchId, qrCodeId);
  }

  @Get('sso')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get magic link for QR-Thrive dashboard SSO' })
  async getMagicLink(@Request() req: RequestWithUser) {
    return this.qrThriveService.getMagicLink(req.user.id);
  }
}
