import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PartnershipsService } from './partnerships.service';
import { InvitePartnershipDto } from './dto/invite-partnership.dto';
import { RespondPartnershipDto } from './dto/respond-partnership.dto';
import { PartnershipQueryDto } from './dto/partnership-query.dto';
import { NearbyPartnersQueryDto } from './dto/nearby-partners-query.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('partnerships')
@ApiBearerAuth()
@Controller('partnerships')
export class PartnershipsController {
  constructor(private readonly partnershipsService: PartnershipsService) {}

  @Get('nearby-branches')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get nearby business branches to partner with',
    description: 'Finds active branches of other businesses within a radius that do not have active or pending partnerships.',
  })
  async findNearbyBranches(@Query() query: NearbyPartnersQueryDto, @Req() req: any) {
    return this.partnershipsService.findNearbyPartnerableBranches(query, req.user);
  }

  @Post('invite')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Invite a branch for partnership',
    description: 'Sends a partnership invitation to another branch.',
  })
  async invite(@Body() dto: InvitePartnershipDto, @Req() req: any) {
    return this.partnershipsService.invitePartnership(dto, req.user);
  }

  @Patch(':id/respond')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Accept or decline a partnership invitation',
    description: 'Allows the recipient branch to accept or decline the partnership invitation.',
  })
  async respond(
    @Param('id') id: string,
    @Body() dto: RespondPartnershipDto,
    @Req() req: any,
  ) {
    return this.partnershipsService.respondToInvitation(id, req.user, dto.status);
  }

  @Get('invitations')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get all partnership invitations (sent and received) with pagination',
    description: 'Retrieves all invitations involving the branch, filterable by sent/received and status.',
  })
  async getInvitations(@Query() query: PartnershipQueryDto, @Req() req: any) {
    return this.partnershipsService.getInvitations(query, req.user);
  }
}
