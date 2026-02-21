import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { RequestQuoteDto } from './dto/request-quote.dto';
import { NegotiateQuoteDto } from './dto/negotiate-quote.dto';
import { Product } from './entities/product.entity';
import { Quote } from './entities/quote.entity';
import { Order } from './entities/order.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Create a new product (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'The product has been successfully created.',
    type: Product,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all published products (Public)' })
  @ApiResponse({
    status: 200,
    description: 'Return all published products.',
    type: [Product],
  })
  findAll() {
    return this.productsService.findAllPublished();
  }

  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Get('admin')
  @ApiOperation({
    summary: 'Get all products including unpublished (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Return all products.',
    type: [Product],
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  findAllAdmin() {
    return this.productsService.findAllAdmin();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the product.',
    type: Product,
  })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Update product (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'The product has been successfully updated.',
    type: Product,
  })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete product (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'The product has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Roles(UserRole.OWNER)
  @ApiBearerAuth()
  @Post(':id/quote')
  @ApiOperation({ summary: 'Request a quote for a product (Owner only)' })
  @ApiResponse({
    status: 201,
    description: 'The quote request has been successfully created.',
    type: Quote,
  })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  requestQuote(
    @Request() req: { user: User },
    @Param('id') id: string,
    @Body() requestQuoteDto: RequestQuoteDto,
  ) {
    return this.productsService.requestQuote(req.user, id, requestQuoteDto);
  }

  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Get('quotes/all')
  @ApiOperation({ summary: 'Get all quote requests (Admin only)' })
  @ApiResponse({
    status: 200,
    type: [Quote],
    schema: {
      example: [
        {
          id: 'quote-1uuid',
          quantity: 100,
          location: 'Lagos, Nigeria',
          businessName: 'My Company Ltd',
          notes: 'I need it asap',
          status: 'Pending',
          userId: 'user-uuid',
          productId: 'product-uuid',
          currentPrice: null,
          isNegotiable: true,
          createdAt: '2023-11-01T10:00:00Z',
        },
      ],
    },
  })
  getAllQuotesAdmin() {
    return this.productsService.getAllQuotesAdmin();
  }

  @Roles(UserRole.OWNER)
  @ApiBearerAuth()
  @Get('quotes/my')
  @ApiOperation({ summary: 'Get my quote requests (Owner only)' })
  @ApiResponse({
    status: 200,
    type: [Quote],
    schema: {
      example: [
        {
          id: 'quote-1uuid',
          quantity: 100,
          location: 'City Center',
          businessName: 'Acme Inc',
          notes: '',
          status: 'Admin_Offered',
          currentPrice: 900,
          isNegotiable: true,
          negotiations: [
            {
              id: 'neg-1',
              priceOffered: 900,
              message: 'Can we do 900?',
              offeredBy: 'Admin',
            },
          ],
        },
      ],
    },
  })
  getMyQuotes(@Request() req: { user: User }) {
    return this.productsService.getMyQuotes(req.user.id);
  }

  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiBearerAuth()
  @Post('quotes/:id/negotiate')
  @ApiOperation({ summary: 'Negotiate a quote (Admin or Owner)' })
  @ApiResponse({
    status: 201,
    type: Quote,
    schema: {
      example: {
        id: 'quote-1uuid',
        status: 'Owner_Offered',
        currentPrice: 850,
        isNegotiable: true,
      },
    },
  })
  negotiateQuote(
    @Request() req: { user: User },
    @Param('id') id: string,
    @Body() dto: NegotiateQuoteDto,
  ) {
    return this.productsService.negotiateQuote(id, req.user, dto);
  }

  @Roles(UserRole.OWNER)
  @ApiBearerAuth()
  @Post('quotes/:id/accept')
  @ApiOperation({ summary: 'Accept a negotiated quote (Owner only)' })
  @ApiResponse({
    status: 201,
    type: Order,
    description: 'Generates a new pending order from the quote',
    schema: {
      example: {
        id: 'order-1uuid',
        quoteId: 'quote-1uuid',
        agreedPrice: 850,
        status: 'Pending',
        userId: 'owner-uuid',
      },
    },
  })
  acceptQuote(@Request() req: { user: User }, @Param('id') id: string) {
    return this.productsService.acceptQuote(id, req.user);
  }

  @Roles(UserRole.OWNER)
  @ApiBearerAuth()
  @Post('quotes/:id/reject')
  @ApiOperation({ summary: 'Reject a negotiated quote (Owner only)' })
  @ApiResponse({
    status: 201,
    type: Quote,
    description: 'Marks the quote as rejected',
    schema: { example: { id: 'quote-1uuid', status: 'Rejected' } },
  })
  rejectQuote(@Request() req: { user: User }, @Param('id') id: string) {
    return this.productsService.rejectQuote(id, req.user);
  }

  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Get('orders/all')
  @ApiOperation({ summary: 'Get all orders (Admin only)' })
  @ApiResponse({
    status: 200,
    type: [Order],
    schema: {
      example: [
        {
          id: 'order-1uuid',
          quoteId: 'quote-uuid',
          agreedPrice: 850,
          status: 'Ready',
          userId: 'owner-uuid',
          createdAt: '2023-11-01T10:00:00Z',
          user: { firstName: 'John', lastName: 'Doe' },
          quote: { quantity: 100 },
        },
      ],
    },
  })
  getAllOrdersAdmin() {
    return this.productsService.getAllOrdersAdmin();
  }

  @Roles(UserRole.OWNER)
  @ApiBearerAuth()
  @Get('orders/my')
  @ApiOperation({ summary: 'Get my orders (Owner only)' })
  @ApiResponse({
    status: 200,
    type: [Order],
    schema: {
      example: [
        {
          id: 'order-1uuid',
          quoteId: 'quote-uuid',
          agreedPrice: 850,
          status: 'Ready',
          userId: 'owner-uuid',
        },
      ],
    },
  })
  getMyOrders(@Request() req: { user: User }) {
    return this.productsService.getMyOrders(req.user.id);
  }

  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Patch('orders/:id/ready')
  @ApiOperation({ summary: 'Mark an order as ready (Admin only)' })
  @ApiResponse({
    status: 200,
    type: Order,
    schema: {
      example: {
        id: 'order-1uuid',
        quoteId: 'quote-uuid',
        agreedPrice: 850,
        status: 'Ready',
        userId: 'owner-uuid',
      },
    },
  })
  markOrderReady(@Param('id') id: string) {
    return this.productsService.markOrderReady(id);
  }
}
