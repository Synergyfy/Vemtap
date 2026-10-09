import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { SavedService } from '../saved.service';
import { SaveStatusResponseDto, SaveToggleResponseDto } from '../dto/saved.dto';
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
@Controller('businesses')
export class BusinessesSaveController {
  constructor(private readonly savedService: SavedService) {}

  @Post(':id/save')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({
    summary: 'Toggle save on a business',
    description:
      'Saves the business if not saved, otherwise removes the save. ' +
      'Returns the resulting state. Access: CUSTOMER',
  })
  @ApiResponse({ status: 201, type: SaveToggleResponseDto })
  @ApiResponse({ status: 404, description: 'Business not found' })
  async toggleSave(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SaveToggleResponseDto> {
    return this.savedService.toggleBusinessSave(req.user.id, id);
  }

  @Get(':id/save-status')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({
    summary: 'Check if the customer saved a business',
    description:
      'Returns `{ isSaved }` for the authenticated customer. Access: CUSTOMER',
  })
  @ApiResponse({ status: 200, type: SaveStatusResponseDto })
  async getSaveStatus(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SaveStatusResponseDto> {
    return this.savedService.getBusinessSaveStatus(req.user.id, id);
  }
}
