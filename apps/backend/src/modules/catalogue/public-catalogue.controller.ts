import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CatalogueService } from './catalogue.service';
import { CatalogueQueryDto } from './dto/item.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Public Catalogue')
@Controller('public/catalogue')
export class PublicCatalogueController {
  constructor(private readonly catalogueService: CatalogueService) {}

  @Public()
  @Get('items/branch/:branchId')
  @ApiOperation({ summary: 'List active items for a specific branch' })
  async listItems(
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @Query() query: CatalogueQueryDto,
  ) {
    return this.catalogueService.findAllItemsPublic(branchId, query);
  }

  @Public()
  @Get('items/:id')
  @ApiOperation({ summary: 'Get details of a specific item' })
  async getItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.catalogueService.findOneItem(id, branchId);
  }

  @Public()
  @Get('categories/business/:businessId')
  @ApiOperation({ summary: 'List categories for a business' })
  async listCategories(@Param('businessId', ParseUUIDPipe) businessId: string) {
    return this.catalogueService.findAllCategories(businessId);
  }

  @Public()
  @Get('categories/branch/:branchId')
  @ApiOperation({ summary: 'List categories with active items for a specific branch' })
  async listCategoriesByBranch(
    @Param('branchId', ParseUUIDPipe) branchId: string,
  ) {
    return this.catalogueService.findAllCategoriesByBranch(branchId);
  }
}
