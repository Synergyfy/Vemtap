import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { PasswordResetHistory } from './entities/password-reset-history.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

import { BusinessesModule } from '../businesses/businesses.module';
import { BranchesModule } from '../branches/branches.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, PasswordResetHistory]),
    BusinessesModule,
    BranchesModule,
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule { }
