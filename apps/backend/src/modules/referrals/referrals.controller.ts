import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReferralsService } from './referrals.service';
import { ClaimReferralDto } from './dto/claim-referral.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

/** The request as the JWT guard leaves it. */
interface ReferralRequest {
  user: { id: string };
}

@ApiTags('Referrals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  /** The signed-in user's own referral code and who has used it so far. */
  @Get('me')
  async me(@Request() req: ReferralRequest) {
    return this.referralsService.getMe(req.user.id);
  }

  /** Apply one referral code on the signed-in, freshly created account. */
  @Post('claim')
  @HttpCode(HttpStatus.OK)
  async claim(@Request() req: ReferralRequest, @Body() dto: ClaimReferralDto) {
    return this.referralsService.claim(dto.code, req.user.id);
  }
}
