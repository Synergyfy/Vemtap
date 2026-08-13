import { Module } from '@nestjs/common';
import { FosAiAssistantController } from './fos-ai-assistant.controller';
import { FosAiAssistantService } from './fos-ai-assistant.service';
import { FosCoreModule } from '../fos-core/fos-core.module';

@Module({
  imports: [FosCoreModule],
  controllers: [FosAiAssistantController],
  providers: [FosAiAssistantService],
  exports: [FosAiAssistantService],
})
export class FosAiAssistantModule {}
