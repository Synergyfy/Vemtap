import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { UserRole } from '../users/entities/user.entity';
import { BusinessCustomersService } from './business-customers.service';
import {
  CUSTOMER_SEGMENTS,
  CustomerDirectoryQueryDto,
  type CustomerSegment,
  SaveCustomerNoteDto,
} from './dto/business-customers.dto';

/** `ParseEnumPipe` takes an enum-like object of the allowed values. */
const SEGMENT_VALUES = Object.fromEntries(
  CUSTOMER_SEGMENTS.map((segment) => [segment, segment]),
);

interface BusinessRequest {
  user: { id: string; businessId: string };
}

@ApiTags('Business Customers (CRM)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
@Permissions('visitors', 'customer-experience')
@Controller('business-customers')
export class BusinessCustomersController {
  constructor(private readonly customers: BusinessCustomersService) {}

  @Get()
  @ApiOperation({
    summary:
      'Customer directory: everyone who bought, visited, booked, claimed or chatted',
    description:
      'Signed-in customers with any touch at the business (or the branch in `branchId`). ' +
      'Segments: frequent (≥10 visits or ≥₦100,000), new (first touch in 30 days), inactive ' +
      '(no touch in 60 days), returning (≥2 visits, not frequent or inactive). `meta.segmentCounts` ' +
      'respect `search` but not `segment`; `meta.insight` covers every customer in scope.',
  })
  @ApiResponse({
    status: 200,
    description: '{ data, total, page, limit, hasNextPage, meta }',
  })
  directory(
    @Req() req: BusinessRequest,
    @Query() query: CustomerDirectoryQueryDto,
  ) {
    return this.customers.getDirectory(req.user.businessId, query);
  }

  @Post('export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Export the directory (same filters) as CSV, up to 5,000 rows',
  })
  @ApiResponse({
    status: 200,
    description: '{ filename, mimeType, contentBase64, sizeBytes, records }',
  })
  export(
    @Req() req: BusinessRequest,
    @Body() query: CustomerDirectoryQueryDto,
  ) {
    return this.customers.exportCsv(req.user.businessId, query);
  }

  @Get('segments/:segment/insights')
  @ApiOperation({
    summary:
      'Insights for a built-in segment (all, frequent, returning, new, inactive)',
    description:
      'Same shape as GET /segments/:id/insights: reach, spend, branch split, favourites, sample patrons.',
  })
  segmentInsights(
    @Req() req: BusinessRequest,
    @Param('segment', new ParseEnumPipe(SEGMENT_VALUES))
    segment: CustomerSegment,
  ) {
    return this.customers.segmentInsights(req.user.businessId, segment);
  }

  @Get(':userId')
  @ApiOperation({
    summary:
      'Customer dossier: profile, relationship metrics, recent activity, note',
    description: '404 unless the customer has touched this business.',
  })
  @ApiResponse({ status: 200, description: 'Dossier' })
  @ApiResponse({ status: 404, description: 'Not a customer of this business' })
  dossier(
    @Req() req: BusinessRequest,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.customers.getDossier(req.user.businessId, userId);
  }

  @Put(':userId/note')
  @ApiOperation({
    summary: 'Save the private note and/or tags on a customer',
    description:
      'Tags are trimmed, lower-cased and de-duplicated (max 10 × 30 chars).',
  })
  @ApiResponse({ status: 200, description: '{ note, tags, updatedAt }' })
  saveNote(
    @Req() req: BusinessRequest,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: SaveCustomerNoteDto,
  ) {
    return this.customers.saveNote(
      req.user.businessId,
      userId,
      req.user.id,
      dto,
    );
  }
}
