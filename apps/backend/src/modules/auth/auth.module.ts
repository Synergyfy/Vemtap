import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { BusinessesModule } from '../businesses/businesses.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { MailModule } from '../mail/mail.module';
import { DevicesModule } from '../devices/devices.module';
import { AffiliatesModule } from '../affiliates/affiliates.module';
import { ExternalAffiliateModule } from '../affiliates/external-affiliate.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { Otp } from './entities/otp.entity';

@Module({
  imports: [
    UsersModule,
    forwardRef(() => BusinessesModule),
    forwardRef(() => DevicesModule),
    forwardRef(() => SubscriptionsModule),
    MailModule,
    PassportModule,
    TypeOrmModule.forFeature([Otp]),
    forwardRef(() => AffiliatesModule),
    ExternalAffiliateModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION') as any,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
