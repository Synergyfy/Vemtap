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
import { CatalogueService } from '../catalogue/catalogue.service';
import { CatalogueOfferService } from '../catalogue/catalogue-offer.service';
import { CatalogueItemType } from '../catalogue/entities/catalogue-item.entity';
import { FormsService } from '../forms/forms.service';
import { Public } from '../../common/decorators/public.decorator';
import { AllowPending } from '../../common/decorators/allow-pending.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Device Taps')
@Controller('tap')
export class DeviceTapController {
  constructor(
    private readonly devicesService: DevicesService,
    private readonly visitorsService: VisitorsService,
    private readonly catalogueService: CatalogueService,
    private readonly catalogueOfferService: CatalogueOfferService,
    private readonly formsService: FormsService,
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

    const branchId = deviceWithRelations.branch.id;
    const [productCount, serviceCount, offerCount, forms] = await Promise.all([
      this.catalogueService.countItemsByType(branchId, CatalogueItemType.PRODUCT),
      this.catalogueService.countItemsByType(branchId, CatalogueItemType.SERVICE),
      this.catalogueOfferService.countOffers(branchId),
      this.formsService.getFormsForVisitor(branchId),
    ]);

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
        engagement: deviceWithRelations.branch.engagement,
        productCount,
        serviceCount,
        offerCount,
        formCount: forms.length,
      },
      business: {
        id: deviceWithRelations.branch.business.id,
        name: deviceWithRelations.branch.business.name,
        logoUrl: deviceWithRelations.branch.business.logoUrl,
      },
    };
  }
}
