import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { BranchFilterDto } from '../../common/dto/branch-filter.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { PosTill } from './entities/pos-till.entity';
import {
  CreatePosTillDto,
  PosTillListResponseDto,
  UpdatePosTillDto,
} from './dto/pos-till.dto';
import { PosTillsService } from './pos-tills.service';

interface RequestWithUser extends Request {
  user: User;
}

@ApiTags('POS Tills')
@ApiBearerAuth()
@Controller('pos/tills')
export class PosTillsController {
  constructor(private readonly tillsService: PosTillsService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({
    summary: 'List tills',
    description:
      "Tills of the business (optionally one branch) with the cashier on each, today's takings and the plan terminal limit. Access: OWNER, MANAGER, ADMIN, STAFF.",
  })
  @ApiResponse({ status: 200, type: PosTillListResponseDto })
  list(@Query() filter: BranchFilterDto, @Req() req: RequestWithUser) {
    return this.tillsService.list(req.user.businessId, filter.branchId);
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Add a till',
    description:
      'Creates a till on a branch of the business. Limited by the plan POS terminal limit. Access: OWNER, MANAGER, ADMIN.',
  })
  @ApiResponse({ status: 201, type: PosTill })
  @ApiResponse({ status: 403, description: 'Plan terminal limit reached' })
  @ApiResponse({ status: 409, description: 'Till code already used' })
  create(@Body() dto: CreatePosTillDto, @Req() req: RequestWithUser) {
    return this.tillsService.create(req.user.businessId, dto);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Rename, relabel or disable a till',
    description: 'Access: OWNER, MANAGER, ADMIN.',
  })
  @ApiResponse({ status: 200, type: PosTill })
  @ApiResponse({ status: 404, description: 'Till not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePosTillDto,
    @Req() req: RequestWithUser,
  ) {
    return this.tillsService.update(req.user.businessId, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Remove a till',
    description:
      'Soft-deletes the till. Refused while a session is open on it. Access: OWNER, MANAGER, ADMIN.',
  })
  @ApiResponse({ status: 409, description: 'Session still open on the till' })
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: RequestWithUser) {
    return this.tillsService.remove(req.user.businessId, id);
  }
}
