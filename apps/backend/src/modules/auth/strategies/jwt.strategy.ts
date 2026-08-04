import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req) => {
          if (req && req.query && req.query.token) {
            return req.query.token as string;
          }
          return null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findOne(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    if (payload.sid) {
      const session = await this.usersService.findActiveSession(payload.sid, user.id);
      if (!session) throw new UnauthorizedException('Session has been revoked');
    }
    // Cast to any to add dynamic properties from token payload
    (user as any).businessId = payload.businessId || user.businessId;
    (user as any).branchId = payload.branchId || user.branchId;
    return user;
  }
}
