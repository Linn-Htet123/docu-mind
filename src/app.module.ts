import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AiLocalController } from './modules/ai-local/ai-local.controller';
import { KnowledgeController } from './modules/knowledge/knowledge.controller';
import { AiLocalService } from './modules/ai-local/ai-local.service';
import { KnowledgeService } from './modules/knowledge/knowledge.service';
import { FileStorageService } from '@common/common/file/file.service';
import { FILE_SERVICE } from '@common/common';
import configuration from './config/configuration';
import { VectorModule } from './modules/vector/vector.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatMessage } from './modules/chat-history/entities/chat-message.entity';
import { ChatHistoryModule } from './modules/chat-history/chat-history.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'knowledge_files/chat_history.db',
      entities: [ChatMessage],
      synchronize: true,
    }),
    VectorModule,
    ChatHistoryModule,
  ],
  controllers: [AppController, AiLocalController, KnowledgeController],
  providers: [
    AppService,
    AiLocalService,
    KnowledgeService,
    { provide: FILE_SERVICE, useClass: FileStorageService },
  ],
})
export class AppModule {}
