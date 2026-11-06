import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DealEngagementService } from './deal-engagement.service';
import { ReviewsAdminQueryDto } from './dto/deal-review.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Deal Reviews Admin')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/reviews')
export class DealReviewAdminController {
  constructor(private readonly engagementService: DealEngagementService) {}

  @Get()
  @ApiOperation({ summary: 'List deal reviews by status (Admin only)' })
  async list(@Query() query: ReviewsAdminQueryDto) {
    return this.engagementService.findReviewsAdmin(
      query.status,
      query.page,
      query.limit,
    );
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a deal review (Admin only)' })
  async approve(@Param('id', ParseUUIDPipe) id: string) {
    return this.engagementService.approveReview(id);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a deal review (Admin only)' })
  async reject(@Param('id', ParseUUIDPipe) id: string) {
    return this.engagementService.rejectReview(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a deal review (Admin only)' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.engagementService.removeReview(id);
  }
}
