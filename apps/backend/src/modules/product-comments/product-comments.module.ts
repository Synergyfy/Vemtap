import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogueItem } from '../catalogue/entities/catalogue-item.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProductComment } from './entities/product-comment.entity';
import { ProductLike } from './entities/product-like.entity';
import { ProductCommentsService } from './product-comments.service';
import { ProductLikesService } from './product-likes.service';
import {
  BusinessProductCommentsController,
  ProductCommentsController,
} from './product-comments.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductComment,
      ProductLike,
      CatalogueItem,
      User,
    ]),
    NotificationsModule,
  ],
  controllers: [ProductCommentsController, BusinessProductCommentsController],
  providers: [ProductCommentsService, ProductLikesService],
})
export class ProductCommentsModule {}
