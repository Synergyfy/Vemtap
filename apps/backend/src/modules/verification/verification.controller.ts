import {
  BadRequestException,
  Body,
  Controller,
  HttpStatus,
  Post,
  Request,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { UserRole } from '../users/entities/user.entity';
import { VerificationService, DojahVerificationResult } from './verification.service';
import { VerifyNinDto, VerifyCacDto } from './dto/verify.dto';

@ApiTags('Verification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post('nin')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN)
  @Permissions('verification')
  @ApiOperation({
    summary: 'Verify National Identification Number (NIN)',
    description:
      'Submits an NIN slip document and personal details to Dojah for identity verification. Returns verification result with status and verification ID.',
  })
  @ApiBody({ type: () => require('./dto/verify.dto').VerifyNinDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'NIN verification submitted successfully',
    schema: {
      example: {
        success: true,
        verificationId: 'ver_abc123',
        status: 'verified',
        message: 'Identity verified successfully',
        data: { nin: '12345678901', fullName: 'John Doe' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input or document',
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'Verification service unavailable or not configured',
  })
  async verifyNin(
    @Body() dto: { documentUrl: string; nin: string; firstName: string; lastName: string; phoneNumber?: string },
    @Request() req: { user?: { id?: string; businessId?: string } },
  ): Promise<{ success: boolean; verificationId: string; status: string; message: string }> {
    const user = req.user;
    if (!user?.businessId) {
      throw new BadRequestException('Business context required for NIN verification');
    }

    const result = await this.verificationService.verifyNin({
      documentUrl: dto.documentUrl,
      nin: dto.nin,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phoneNumber: dto.phoneNumber,
    });

    if (!result.success) {
      throw new BadRequestException(result.message);
    }

    return {
      success: true,
      verificationId: result.verificationId,
      status: result.status,
      message: 'Identity verified successfully',
    };
  }

  @Post('cac')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN)
  @Permissions('verification')
  @ApiOperation({
    summary: 'Verify CAC Certificate',
    description:
      'Submits a CAC certificate document and business details to Dojah for business identity verification. Returns verification result with status and verification ID.',
  })
  @ApiBody({ type: () => require('./dto/verify.dto').VerifyCacDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'CAC verification submitted successfully',
    schema: {
      example: {
        success: true,
        verificationId: 'ver_xyz789',
        status: 'verified',
        message: 'Business verified successfully',
        data: { cacNumber: 'RC-1234567', businessName: 'Acme Ventures Ltd' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input or document',
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'Verification service unavailable or not configured',
  })
  async verifyCac(
    @Body() dto: { documentUrl: string; cacNumber: string; businessName: string; email?: string; phoneNumber?: string },
    @Request() req: { user?: { id?: string; businessId?: string } },
  ): Promise<{ success: boolean; verificationId: string; status: string; message: string }> {
    const user = req.user;
    if (!user?.businessId) {
      throw new BadRequestException('Business context required for CAC verification');
    }

    const result = await this.verificationService.verifyCac({
      documentUrl: dto.documentUrl,
      cacNumber: dto.cacNumber,
      businessName: dto.businessName,
      email: dto.email,
      phoneNumber: dto.phoneNumber,
    });

    if (!result.success) {
      throw new BadRequestException(result.message);
    }

    return {
      success: true,
      verificationId: result.verificationId,
      status: result.status,
      message: 'Business verified successfully',
    };
  }
}