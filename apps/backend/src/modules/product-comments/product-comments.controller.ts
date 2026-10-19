import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ProductCommentsService } from './product-comments.service';
import { ProductLikesService } from './product-likes.service';
import {
  BusinessProductCommentsQueryDto,
  CreateProductCommentDto,
  ProductCommentsQueryDto,
  ReplyToProductCommentDto,
  UpdateProductCommentDto,
} from './dto/product-comment.dto';

interface CommentsRequest {
  user?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    businessId?: string | null;
    role?: UserRole;
  };
}

/** Customer-facing product comments: public to read, signed in to write. */
@ApiTags('Product Comments')
@Controller()
export class ProductCommentsController {
  constructor(
    private readonly commentsService: ProductCommentsService,
    private readonly likesService: ProductLikesService,
  ) {}

  @Public()
  @Get('public/catalogue/items/:itemId/likes')
  @ApiOperation({
    summary: 'Like count for a product or service (Public)',
    description:
      '`liked` is true when a token is sent and the caller likes it.',
  })
  likeStatus(
    @Request() req: CommentsRequest,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.likesService.status(itemId, req.user?.id);
  }

  @ApiBearerAuth()
  @Post('catalogue/items/:itemId/like')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Like a product or service (Authenticated, idempotent)',
  })
  like(
    @Request() req: CommentsRequest,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.likesService.like(req.user!.id, itemId);
  }

  @ApiBearerAuth()
  @Delete('catalogue/items/:itemId/like')
  @ApiOperation({
    summary: 'Remove your like from a product or service (idempotent)',
  })
  unlike(
    @Request() req: CommentsRequest,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.likesService.unlike(req.user!.id, itemId);
  }

  @Public()
  @Get('public/catalogue/items/:itemId/comments')
  @ApiOperation({
    summary: 'List comments on a product (Public)',
    description:
      'Newest first, with `averageRating` and `ratingCount`. `isMine` is true on the caller’s own comment when a token is sent.',
  })
  list(
    @Request() req: CommentsRequest,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Query() query: ProductCommentsQueryDto,
  ) {
    return this.commentsService.list(itemId, query, req.user?.id);
  }

  @ApiBearerAuth()
  @Post('catalogue/items/:itemId/comments')
  @ApiOperation({
    summary: 'Comment on a product (Authenticated)',
    description:
      'Publishes immediately. One comment per customer per product (409); the business cannot comment on its own products (403).',
  })
  create(
    @Request() req: CommentsRequest,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: CreateProductCommentDto,
  ) {
    return this.commentsService.create(req.user!, itemId, dto);
  }

  @ApiBearerAuth()
  @Patch('catalogue/items/:itemId/comments/:commentId')
  @ApiOperation({ summary: 'Edit your own product comment' })
  update(
    @Request() req: CommentsRequest,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body() dto: UpdateProductCommentDto,
  ) {
    return this.commentsService.update(req.user!.id, itemId, commentId, dto);
  }

  @ApiBearerAuth()
  @Delete('catalogue/items/:itemId/comments/:commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete your own product comment' })
  async remove(
    @Request() req: CommentsRequest,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
  ) {
    await this.commentsService.remove(req.user!.id, itemId, commentId);
  }
}

/** The business's view of comments on its products. */
@ApiTags('Product Comments')
@ApiBearerAuth()
@Roles(UserRole.OWNER, UserRole.MANAGER)
@Controller('catalogue/business/comments')
export class BusinessProductCommentsController {
  constructor(private readonly commentsService: ProductCommentsService) {}

  @Get()
  @ApiOperation({ summary: 'Comments on this business’s products (Merchant)' })
  list(
    @Request() req: CommentsRequest,
    @Query() query: BusinessProductCommentsQueryDto,
  ) {
    return this.commentsService.listForBusiness(businessIdOf(req), query);
  }

  @Get('summary')
  @ApiOperation({
    summary: 'Product comment totals, unreplied count and rating spread',
  })
  summary(@Request() req: CommentsRequest) {
    return this.commentsService.summaryForBusiness(businessIdOf(req));
  }

  @Post(':id/reply')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reply publicly to a product comment (Merchant)' })
  reply(
    @Request() req: CommentsRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReplyToProductCommentDto,
  ) {
    return this.commentsService.reply(
      businessIdOf(req),
      id,
      req.user?.id ?? null,
      dto.reply,
    );
  }

  @Delete(':id/reply')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove the business reply (Merchant)' })
  async removeReply(
    @Request() req: CommentsRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.commentsService.removeReply(businessIdOf(req), id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a comment from a product (Merchant)' })
  async remove(
    @Request() req: CommentsRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.commentsService.removeByBusiness(businessIdOf(req), id);
  }
}

function businessIdOf(req: CommentsRequest): string {
  const businessId = req.user?.businessId;
  if (!businessId) {
    throw new BadRequestException('User is not associated with a business');
  }
  return businessId;
}
