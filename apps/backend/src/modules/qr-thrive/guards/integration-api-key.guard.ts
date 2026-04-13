import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class IntegrationApiKeyGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-vemtap-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('API key is missing');
    }

    const expectedApiKey = this.configService.get<string>('VEMTAP_INTEGRATION_KEY');
    
    if (!expectedApiKey) {
      // If not configured, we might want to log this and fail closed for security
      return false;
    }

    if (apiKey !== expectedApiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}
