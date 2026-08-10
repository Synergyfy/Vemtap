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
import { FosRecordsService } from './fos-records.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { FosEnvelope } from '../../common/decorators/fos-envelope.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CreateRecordDto, ListRecordsQueryDto } from './dto/record.dto';

@ApiTags('FOS Records')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@FosEnvelope()
@Controller('records')
export class FosRecordsController {
  constructor(private readonly recordsService: FosRecordsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List manual ledger entries' })
  async list(@Query() query: ListRecordsQueryDto) {
    return this.recordsService.list(query);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a manual ledger entry' })
  async create(@Body() dto: CreateRecordDto) {
    return this.recordsService.create(dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a manual ledger entry' })
  async remove(@Param('id') id: string) {
    return this.recordsService.remove(id);
  }
}
