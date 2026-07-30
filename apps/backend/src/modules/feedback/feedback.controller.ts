import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { FeedbackService } from './feedback.service';

@ApiTags('feedback')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Get('stats')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get feedback metrics and overview stats' })
  async getStats(@Request() req: any) {
    const branchId =
      req.user?.branchId || req.user?.activeBranchId || req.user?.businessId;
    return this.feedbackService.getStats(branchId);
  }

  @Get('reviews')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get customer feedback reviews list' })
  async getReviews(@Request() req: any) {
    const branchId =
      req.user?.branchId || req.user?.activeBranchId || req.user?.businessId;
    return this.feedbackService.getReviews(branchId);
  }
}
