import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DevicesService } from './devices.service';
import { VisitorsService } from '../visitors/visitors.service';
import { Public } from '../../common/decorators/public.decorator';
import { AllowPending } from '../../common/decorators/allow-pending.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Device Taps')
@Controller('tap')
export class DeviceTapController {
  constructor(
    private readonly devicesService: DevicesService,
    private readonly visitorsService: VisitorsService,
  ) {}

  @Public()
  @AllowPending()
  @Get('context/:code')
  @ApiOperation({ summary: 'Get device and business context for a tap' })
  @ApiResponse({
    status: 200,
    description: 'Device context retrieved successfully',
  })
  async getContext(@Param('code') code: string) {
    const deviceWithRelations =
      await this.devicesService.findByCodeWithRelations(code);
    if (!deviceWithRelations) {
      throw new NotFoundException('Device not found');
    }

    if (!deviceWithRelations.branch) {
      throw new BadRequestException('Device is not linked to any branch');
    }

    return {
      device: {
        id: deviceWithRelations.id,
        name: deviceWithRelations.name,
        code: deviceWithRelations.code,
        location: deviceWithRelations.location,
      },
      branch: {
        id: deviceWithRelations.branch.id,
        name: deviceWithRelations.branch.name,
        welcomeMessage: deviceWithRelations.branch.welcomeMessage,
        successMessage: deviceWithRelations.branch.successMessage,
        logoUrl: deviceWithRelations.branch.logoUrl,
      },
      business: {
        id: deviceWithRelations.branch.business.id,
        name: deviceWithRelations.branch.business.name,
        logoUrl: deviceWithRelations.branch.business.logoUrl,
      },
    };
  }
}
