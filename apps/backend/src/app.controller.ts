import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get('public-test')
  getPublic(): string {
    return 'This is public';
  }

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
