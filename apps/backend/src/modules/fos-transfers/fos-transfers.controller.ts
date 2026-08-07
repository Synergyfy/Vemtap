import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FosTransfersService } from './fos-transfers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { FosEnvelope } from '../../common/decorators/fos-envelope.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CreateTransferDto, ListTransfersQueryDto } from './dto/transfer.dto';

@ApiTags('FOS Transfers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@FosEnvelope()
@Controller('transfers')
export class FosTransfersController {
  constructor(private readonly transfersService: FosTransfersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List internal transfers' })
  async list(@Query() query: ListTransfersQueryDto) {
    return this.transfersService.list(query);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create an internal transfer' })
  async create(@Body() dto: CreateTransferDto) {
    return this.transfersService.create(dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete an internal transfer' })
  async remove(@Param('id') id: string) {
    return this.transfersService.remove(id);
  }
}
