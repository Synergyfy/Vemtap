import {
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { FeedbackService, type FeedbackScope } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@ApiTags('feedback')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  /** Owners see the whole business; managers and staff their own branch. */
  private scope(req: {
    user?: {
      role?: UserRole;
      businessId?: string | null;
      branchId?: string | null;
    };
  }): FeedbackScope {
    const user = req.user;
    const role = user?.role;
    return {
      businessId: user?.businessId ?? null,
      branchId:
        role === UserRole.MANAGER || role === UserRole.STAFF
          ? (user?.branchId ?? null)
          : null,
      isAdmin: role === UserRole.ADMIN,
    };
  }

  @Post()
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Submit customer feedback' })
  async create(@Request() req: { user: User }, @Body() dto: CreateFeedbackDto) {
    return this.feedbackService.create(dto, req.user);
  }

  @Get('stats')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get feedback metrics and overview stats' })
  async getStats(@Request() req: any) {
    return this.feedbackService.getStats(this.scope(req));
  }

  @Get('reviews')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get customer feedback reviews list' })
  async getReviews(@Request() req: any) {
    return this.feedbackService.getReviews(this.scope(req));
  }
}
