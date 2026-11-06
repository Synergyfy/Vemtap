import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CatalogueService } from './catalogue.service';
import { CatalogueBranchPricingService } from './catalogue-branch-pricing.service';
import { CatalogueQueryDto } from './dto/item.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Public Catalogue')
@Controller('public/catalogue')
export class PublicCatalogueController {
  constructor(
    private readonly catalogueService: CatalogueService,
    private readonly pricingService: CatalogueBranchPricingService,
  ) {}

  @Public()
  @Get('items/branch/:branchId')
  @ApiOperation({ summary: 'List active items for a specific branch' })
  async listItems(
    @Param('branchId') branchId: string,
    @Query() query: CatalogueQueryDto,
  ) {
    const page = await this.catalogueService.findAllItemsPublic(
      branchId,
      query,
    );
    // Items priced per branch show this branch's price. Price filters and
    // sorting above use the item's base price.
    return {
      ...page,
      data: await this.pricingService.applyBranchPrices(
        page.data,
        await this.catalogueService.resolvePublicBranchId(branchId),
      ),
    };
  }

  @Public()
  @Get('items/:id')
  @ApiOperation({ summary: 'Get details of a specific item' })
  async getItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('branchId') branchId?: string,
  ) {
    const item = await this.catalogueService.findOneItem(id, branchId);
    if (!item || !branchId) return item;
    const [priced] = await this.pricingService.applyBranchPrices(
      [item],
      await this.catalogueService.resolvePublicBranchId(branchId),
    );
    return priced;
  }

  @Public()
  @Get('categories/business/:businessId')
  @ApiOperation({ summary: 'List categories for a business' })
  async listCategories(@Param('businessId', ParseUUIDPipe) businessId: string) {
    return this.catalogueService.findAllCategories(businessId);
  }

  @Public()
  @Get('categories/branch/:branchId')
  @ApiOperation({
    summary: 'List categories with active items for a specific branch',
  })
  async listCategoriesByBranch(@Param('branchId') branchId: string) {
    return this.catalogueService.findAllCategoriesByBranch(branchId);
  }
}
