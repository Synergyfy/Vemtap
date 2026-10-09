import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { User, UserRole } from '../../users/entities/user.entity';

/** Claims the API signs into access tokens (`generateAuthResponse` / `switchRole`). */
interface AccessTokenPayload {
  sub: string;
  sid?: string;
  email?: string;
  role?: UserRole;
  /**
   * `null` is meaningful: it marks a customer-scoped token for a dual-role
   * owner. `undefined` (absent) means "fall back to the DB value".
   */
  businessId?: string | null;
  branchId?: string | null;
}

type RequestUser = Omit<User, 'businessId' | 'branchId'> & {
  businessId?: string | null;
  branchId?: string | null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: { query?: { token?: string } } | undefined) => {
          if (req?.query?.token) {
            return req.query.token;
          }
          return null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: AccessTokenPayload): Promise<RequestUser> {
    const user = (await this.usersService.findOne(
      payload.sub,
    )) as RequestUser | null;
    if (!user) {
      throw new UnauthorizedException();
    }
    if (payload.sid) {
      const session = await this.usersService.findActiveSession(
        payload.sid,
        user.id,
      );
      if (!session) throw new UnauthorizedException('Session has been revoked');
    }
    // Honor the signed token's role and business context. `switch-role` issues
    // CUSTOMER-scoped tokens for dual-role owners; without applying the claim
    // the guards would authorize off the DB role (Owner) and customer-only
    // endpoints would 403 even after switching.
    if (payload.role) {
      user.role = payload.role;
    }

    // An explicit null claim (customer mode) must not be overridden by the DB
    // fallback. Only an *absent* claim falls back — legacy tokens never carried
    // these fields.
    if (Object.prototype.hasOwnProperty.call(payload, 'businessId')) {
      user.businessId = payload.businessId ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'branchId')) {
      user.branchId = payload.branchId ?? null;
    }
    return user;
  }
}
