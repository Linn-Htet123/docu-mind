import { Module } from '@nestjs/common';
import { AiLocalService } from './services/ai-local.service';
import { PipelineService } from './services/pipeline.service';
import { ChatHistoryModule } from '../chat-history/chat-history.module';
import { VectorModule } from '../vector/vector.module';
import { AiLocalController } from './ai-local.controller';

@Module({
  imports: [ChatHistoryModule, VectorModule],
  providers: [AiLocalService, PipelineService],
  exports: [AiLocalService],
  controllers: [AiLocalController],
})
export class AiLocalModule {}
