import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BundleDiscountsService } from '../services/bundle-discounts.service';
import {
  CreateBundleDiscountDto,
  UpdateBundleDiscountDto,
} from '../dto/bundle-discount.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';

@ApiTags('admin-bundle-discounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/bundle-discounts')
export class BundleDiscountsController {
  constructor(
    private readonly bundleDiscountsService: BundleDiscountsService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: List all bundle discounts' })
  async findAll() {
    return this.bundleDiscountsService.findAll();
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Create a new bundle discount' })
  async create(@Body() createDto: CreateBundleDiscountDto) {
    return this.bundleDiscountsService.create(createDto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Update a bundle discount' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateBundleDiscountDto,
  ) {
    return this.bundleDiscountsService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Delete a bundle discount' })
  async remove(@Param('id') id: string) {
    return this.bundleDiscountsService.remove(id);
  }
}
