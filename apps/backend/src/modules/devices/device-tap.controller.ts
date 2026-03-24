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
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Device Taps')
@Controller('tap')
export class DeviceTapController {
  constructor(
    private readonly devicesService: DevicesService,
    private readonly visitorsService: VisitorsService,
  ) {}

  @Public()
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

  @Public()
  @Post('record/:code')
  @ApiOperation({
    summary: 'Record a visit for an anonymous or identified user',
  })
  async recordVisit(
    @Param('code') code: string,
    @Body()
    dto: { visitorId?: string; name?: string; email?: string; phone?: string },
  ) {
    const device = await this.devicesService.findByCode(code);
    if (!device) {
      throw new NotFoundException('Device not found');
    }

    // If visitorId is provided, we use recordVisit
    if (dto.visitorId) {
      return this.visitorsService.recordVisit(dto.visitorId, code);
    }

    // Otherwise we might want to create a temporary visit or wait for signup
    // For now, let's just return success if it's an anonymous tap context
    // The actual visit record usually happens after identity is established in user-step

    return { message: 'Tap recognized', deviceCode: code };
  }
}
