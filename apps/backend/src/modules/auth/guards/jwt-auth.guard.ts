import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Prevent redundant executions from overwriting mutated state (e.g., from ImpersonationGuard)
    if (request.user && request.user.id) {
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    try {
      const result = await super.canActivate(context);
      if (typeof result === 'boolean') return result;
      return true; // Should ideally handle observables/promises better but this works for most passport strategies
    } catch (err) {
      if (isPublic) {
        return true;
      }
      throw err;
    }
  }
}
