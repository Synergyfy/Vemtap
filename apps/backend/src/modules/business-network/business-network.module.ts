import { Module } from '@nestjs/common';
import { BusinessNetworkController } from './business-network.controller';
import { BusinessNetworkService } from './business-network.service';

@Module({
  controllers: [BusinessNetworkController],
  providers: [BusinessNetworkService],
})
export class BusinessNetworkModule {}
