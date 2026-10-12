import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { SavedService } from '../saved.service';
import {
  SavedPageDto,
  SavedQueryDto,
  SavedUnifiedPageDto,
} from '../dto/saved.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { User, UserRole } from '../../users/entities/user.entity';

interface RequestWithUser extends Request {
  user: User;
}

@ApiTags('Saved Hub')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('me/saved')
export class MeSavedController {
  constructor(private readonly savedService: SavedService) {}

  @Get()
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({
    summary: 'Unified saved feed (deals, businesses, services)',
    description:
      'Returns the customer’s saved items across all three stores, newest ' +
      'first, merged and paginated. Filter with `type`. Unfiltered, the ' +
      'response also carries `totals` (per-store counts for the tab badges); ' +
      'omit it for a `type` read, which skips the other stores. ' +
      'Access: CUSTOMER',
  })
  @ApiResponse({ status: 200, type: SavedUnifiedPageDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid token' })
  @ApiResponse({
    status: 403,
    description: 'Authenticated user is not a CUSTOMER',
  })
  async listAll(
    @Req() req: RequestWithUser,
    @Query() query: SavedQueryDto,
  ): Promise<SavedUnifiedPageDto> {
    return this.savedService.getUnifiedSaved(req.user.id, query);
  }

  @Get('deals')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({
    summary: 'List saved deals',
    description:
      'Paginated list of the customer’s saved deals. Access: CUSTOMER',
  })
  @ApiResponse({ status: 200, type: SavedPageDto })
  async listDeals(
    @Req() req: RequestWithUser,
    @Query() query: SavedQueryDto,
  ): Promise<SavedPageDto> {
    return this.savedService.getSavedDeals(
      req.user.id,
      query.page ?? 1,
      query.limit ?? 10,
    );
  }

  @Get('businesses')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({
    summary: 'List saved businesses',
    description:
      'Paginated list of the customer’s saved businesses. Access: CUSTOMER',
  })
  @ApiResponse({ status: 200, type: SavedPageDto })
  async listBusinesses(
    @Req() req: RequestWithUser,
    @Query() query: SavedQueryDto,
  ): Promise<SavedPageDto> {
    return this.savedService.getSavedBusinesses(
      req.user.id,
      query.page ?? 1,
      query.limit ?? 10,
    );
  }

  @Get('services')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({
    summary: 'List saved services',
    description:
      'Paginated list of the customer’s saved services (catalogue items of ' +
      'type `service`). Access: CUSTOMER',
  })
  @ApiResponse({ status: 200, type: SavedPageDto })
  async listServices(
    @Req() req: RequestWithUser,
    @Query() query: SavedQueryDto,
  ): Promise<SavedPageDto> {
    return this.savedService.getSavedServices(
      req.user.id,
      query.page ?? 1,
      query.limit ?? 10,
    );
  }
}
