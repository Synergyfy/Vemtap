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
import { QrThriveService } from '../qr-thrive/qr-thrive.service';
import { Public } from '../../common/decorators/public.decorator';
import { AllowPending } from '../../common/decorators/allow-pending.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BranchesService } from '../branches/branches.service';
import { Branch } from '../branches/entities/branch.entity';

@ApiTags('Device Taps')
@Controller('tap')
export class DeviceTapController {
  constructor(
    private readonly devicesService: DevicesService,
    private readonly visitorsService: VisitorsService,
    private readonly catalogueService: CatalogueService,
    private readonly catalogueOfferService: CatalogueOfferService,
    private readonly formsService: FormsService,
    private readonly qrThriveService: QrThriveService,
    private readonly branchesService: BranchesService,
  ) {}

  @Public()
  @AllowPending()
  @Get('context/:code')
  @ApiOperation({
    summary: 'Get device and business context for a tap',
    description: 'Retrieves the full UBL (User Business Landing) context for a device tap. Returns device info, branch details, product/service counts, QR-Thrive codes, and business info. This is the core endpoint that powers the customer-facing portal.',
  })
  @ApiResponse({
    status: 200,
    description: 'Device context retrieved successfully',
    schema: {
      example: {
        device: {
          id: 'device-uuid-123',
          name: 'Main Entrance NFC',
          code: 'LT-8829-X',
          location: 'Main Entrance',
        },
        branch: {
          id: 'branch-uuid-456',
          name: 'Main Office',
          welcomeMessage: 'Welcome to our store!',
          successMessage: 'Visit recorded successfully!',
          whatsappNumber: '+1234567890',
          logoUrl: 'https://example.com/logo.png',
          engagement: {
            instagram: 'https://instagram.com/branch',
            linkedin: 'https://linkedin.com/company/branch',
          },
          productCount: 25,
          serviceCount: 10,
          offerCount: 5,
          formCount: 3,
        },
        qrThriveCodes: [
          {
            id: 'qr-external-123',
            name: 'Feedback Form',
            type: 'form',
            shortId: 'abc123',
            shortUrl: '/s/abc123',
          },
        ],
        business: {
          id: 'business-uuid-789',
          name: 'VemTap Store',
          logoUrl: 'https://example.com/business-logo.png',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Device not found' })
  @ApiResponse({ status: 400, description: 'Device is not linked to any branch' })
  async getContext(@Param('code') code: string) {
    return this.getDeviceContext(code);
  }

  @Public()
  @AllowPending()
  @Get('context-by-username/:username')
  @ApiOperation({
    summary: 'Get device and business context by branch username',
    description:
      'Alternative endpoint that resolves branch by username instead of device code. ' +
      'Access the UBL page via /b/[username] instead of /[slug]/[deviceCode]. ' +
      'Returns the same response structure as context/:code. ' +
      'Useful for creating human-readable, memorable URLs for branch access.',
  })
  @ApiResponse({
    status: 200,
    description: 'Context retrieved successfully via username',
    schema: {
      example: {
        device: {
          id: 'device-uuid-123',
          name: 'Main Entrance NFC',
          code: 'LT-8829-X',
          location: 'Main Entrance',
        },
        branch: {
          id: 'branch-uuid-456',
          name: 'Main Office',
          username: 'main-office',
          welcomeMessage: 'Welcome to our store!',
          successMessage: 'Visit recorded successfully!',
          whatsappNumber: '+1234567890',
          logoUrl: 'https://example.com/logo.png',
          engagement: {
            instagram: 'https://instagram.com/branch',
            linkedin: 'https://linkedin.com/company/branch',
          },
          productCount: 25,
          serviceCount: 10,
          offerCount: 5,
          formCount: 3,
        },
        qrThriveCodes: [
          {
            id: 'qr-external-123',
            name: 'Feedback Form',
            type: 'form',
            shortId: 'abc123',
            shortUrl: '/s/abc123',
          },
        ],
        business: {
          id: 'business-uuid-789',
          name: 'VemTap Store',
          logoUrl: 'https://example.com/business-logo.png',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Branch with username not found or branch is inactive',
    schema: {
      example: {
        statusCode: 404,
        message: 'Branch with username "nonexistent" not found',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'No active device found for branch',
    schema: {
      example: {
        statusCode: 400,
        message: 'No active device found for this branch',
        error: 'Bad Request',
      },
    },
  })
  async getContextByUsername(@Param('username') username: string) {
    // Find branch by username
    const branch = await this.branchesService.findByUsername(username);
    if (!branch) {
      throw new NotFoundException(`Branch with username "${username}" not found`);
    }

    // Get first active device for this branch
    const device = await this.devicesService.findFirstByBranchId(branch.id);
    if (!device) {
      throw new BadRequestException('No active device found for this branch');
    }

    // Reuse existing context logic by calling with device code
    return this.getDeviceContext(device.code);
  }

  /**
   * Extracted common context logic for reuse
   */
  private async getDeviceContext(deviceCode: string) {
    let deviceWithRelations =
      await this.devicesService.findByCodeWithRelations(deviceCode);

    if (!deviceWithRelations) {
      // Fallback: Check if deviceCode is a branch uniqueCode or branch username
      let branch: Branch | null = null;
      try {
        branch = await this.branchesService.findByCode(deviceCode);
      } catch (err) {
        branch = await this.branchesService.findByUsername(deviceCode);
      }

      if (branch) {
        const devices = await this.devicesService.findAllByBranch(branch.id);
        const mainDevice = devices.find(d => d.isMain) || devices[0];
        if (mainDevice) {
          deviceWithRelations = await this.devicesService.findByCodeWithRelations(mainDevice.code);
        }
      }
    }

    if (!deviceWithRelations) {
      throw new NotFoundException('Device not found');
    }

    if (!deviceWithRelations.branch) {
      throw new BadRequestException('Device is not linked to any branch');
    }

    const branchId = deviceWithRelations.branch.id;
    const [productCount, serviceCount, offerCount, forms] = await Promise.all([
      this.catalogueService.countItemsByType(
        branchId,
        CatalogueItemType.PRODUCT,
      ),
      this.catalogueService.countItemsByType(
        branchId,
        CatalogueItemType.SERVICE,
      ),
      this.catalogueOfferService.countOffers(branchId),
      this.formsService.getFormsForVisitor(branchId),
    ]);

    const branchData = {
      productCount,
      serviceCount,
      offerCount,
      formCount: forms.length,
    };

    // Fetch QR-Thrive metadata if ublSequence has external IDs
    let qrThriveCodes: any[] = [];
    const ublSequence = deviceWithRelations.branch.engagement?.ublSequence || [];
    const externalQrIds = ublSequence.filter((id: string) => !id.startsWith('system:'));
    
    if (externalQrIds.length > 0) {
      qrThriveCodes = await this.qrThriveService.getPublicQRCodesForBranch(
        branchId,
        externalQrIds,
      );
    }

    return {
      device: {
        id: deviceWithRelations.id,
        name: deviceWithRelations.name,
        code: deviceWithRelations.code,
        location: deviceWithRelations.location,
      },
      branch: {
        ...branchData,
        id: deviceWithRelations.branch.id,
        name: deviceWithRelations.branch.name,
        welcomeMessage: deviceWithRelations.branch.welcomeMessage,
        successMessage: deviceWithRelations.branch.successMessage,
        whatsappNumber: deviceWithRelations.branch.whatsappNumber,
        logoUrl: deviceWithRelations.branch.logoUrl,
        engagement: deviceWithRelations.branch.engagement,
        showReview: deviceWithRelations.branch.showReview,
        showSocial: deviceWithRelations.branch.showSocial,
        showFeedback: deviceWithRelations.branch.showFeedback,
        welcomeTitle: deviceWithRelations.branch.welcomeTitle,
        welcomeTag: deviceWithRelations.branch.welcomeTag,
        formAppearanceColor: deviceWithRelations.branch.formAppearanceColor,
      },
      qrThriveCodes,
      business: {
        id: deviceWithRelations.branch.business.id,
        name: deviceWithRelations.branch.business.name,
        logoUrl: deviceWithRelations.branch.business.logoUrl,
      },
    };
  }
}
