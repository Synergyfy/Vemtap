import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { CatalogueCartService } from './catalogue-cart.service';
import {
  AddToCartDto,
  MergeGuestCartDto,
  UpdateCartItemDto,
  CheckoutCartDto,
} from './dto/catalogue-cart.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: any;
}

@Controller('catalogue/cart')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
export class CatalogueCartController {
  constructor(private readonly catalogueCartService: CatalogueCartService) {}

  @Get()
  async getCart(
    @Req() req: RequestWithUser,
    @Query('branchId') branchId: string,
  ) {
    if (!branchId)
      throw new BadRequestException('branchId query parameter is required');
    return this.catalogueCartService.getCart(req.user.id, branchId);
  }

  @Get('summary')
  async getCartSummary(
    @Req() req: RequestWithUser,
    @Query('branchId') branchId: string,
  ) {
    if (!branchId)
      throw new BadRequestException('branchId query parameter is required');
    return this.catalogueCartService.getCartSummary(req.user.id, branchId);
  }

  @Post('items')
  async addItemToCart(@Req() req: RequestWithUser, @Body() dto: AddToCartDto) {
    return this.catalogueCartService.addItemToCart(req.user.id, dto);
  }

  @Patch('items/:cartItemId')
  async updateCartItem(
    @Req() req: RequestWithUser,
    @Param('cartItemId') cartItemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.catalogueCartService.updateCartItem(
      req.user.id,
      cartItemId,
      dto.quantity,
    );
  }

  @Delete('items/:cartItemId')
  async removeCartItem(
    @Req() req: RequestWithUser,
    @Param('cartItemId') cartItemId: string,
  ) {
    return this.catalogueCartService.removeCartItem(req.user.id, cartItemId);
  }

  @Delete()
  async clearCart(
    @Req() req: RequestWithUser,
    @Query('branchId') branchId: string,
  ) {
    if (!branchId)
      throw new BadRequestException('branchId query parameter is required');
    return this.catalogueCartService.clearCart(req.user.id, branchId);
  }

  @Post('merge')
  @HttpCode(HttpStatus.OK)
  async mergeGuestCart(
    @Req() req: RequestWithUser,
    @Body() dto: MergeGuestCartDto,
  ) {
    return this.catalogueCartService.mergeGuestCart(req.user.id, dto);
  }

  @Post('checkout')
  @HttpCode(HttpStatus.CREATED)
  async checkoutCart(
    @Req() req: RequestWithUser,
    @Body() dto: CheckoutCartDto,
  ) {
    return this.catalogueCartService.checkoutCart(req.user.id, dto, req.user);
  }
}
