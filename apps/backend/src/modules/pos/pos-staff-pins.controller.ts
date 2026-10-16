import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '../../common/decorators/roles.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import {
  PosOverrideQueryDto,
  PosOverrideTokenDto,
  PosStaffPinRowDto,
  SetPosStaffPinDto,
  VerifyPosOverrideDto,
} from './dto/pos-staff-pin.dto';
import { PosStaffPinsService } from './pos-staff-pins.service';

interface RequestWithUser extends Request {
  user: User;
}

@ApiTags('POS Staff PINs')
@ApiBearerAuth()
@Controller('pos/staff-pins')
export class PosStaffPinsController {
  constructor(private readonly staffPinsService: PosStaffPinsService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Team PIN status',
    description:
      'Owners, managers and staff of the business with whether they have a POS PIN, supervisor flag and lock state. Never returns hashes. Access: OWNER, MANAGER, ADMIN.',
  })
  @ApiResponse({ status: 200, type: [PosStaffPinRowDto] })
  list(@Req() req: RequestWithUser) {
    return this.staffPinsService.list(req.user.businessId);
  }

  @Get('overrides')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Supervisor override audit log',
    description:
      'Paginated approvals, newest first, with who approved and who asked. Access: OWNER, MANAGER, ADMIN.',
  })
  listOverrides(
    @Query() query: PosOverrideQueryDto,
    @Req() req: RequestWithUser,
  ) {
    return this.staffPinsService.listOverrides(req.user.businessId, query);
  }

  @Post('verify')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({
    summary: 'Approve an action with a supervisor PIN',
    description:
      'Checks the PIN against the business supervisor PINs, logs the approval and returns a 2-minute overrideToken for that action. Five misses lock the supervisor PINs for 15 minutes. Access: OWNER, MANAGER, ADMIN, STAFF.',
  })
  @ApiResponse({ status: 201, type: PosOverrideTokenDto })
  @ApiResponse({ status: 401, description: 'Incorrect supervisor PIN' })
  @ApiResponse({ status: 403, description: 'No supervisor PIN configured' })
  verify(@Body() dto: VerifyPosOverrideDto, @Req() req: RequestWithUser) {
    return this.staffPinsService.verify(req.user, dto);
  }

  @Put(':userId')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({
    summary: "Set a team member's POS PIN",
    description:
      'Creates or replaces the PIN (4–6 digits) and clears any lock. Access: OWNER, MANAGER.',
  })
  @ApiResponse({ status: 404, description: 'Not a member of this business' })
  set(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: SetPosStaffPinDto,
    @Req() req: RequestWithUser,
  ) {
    return this.staffPinsService.set(req.user.businessId, userId, dto);
  }

  @Delete(':userId')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({
    summary: "Remove a team member's POS PIN",
    description: 'Access: OWNER, MANAGER.',
  })
  @ApiResponse({ status: 404, description: 'No PIN set for this user' })
  remove(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.staffPinsService.remove(req.user.businessId, userId);
  }
}
