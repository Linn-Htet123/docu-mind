import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import configuration from 'config/configuration';
import { AiLocalController } from './modules/ai-local/ai-local.controller';
import { KnowledgeController } from './modules/knowledge/knowledge.controller';
import { AiLocalService } from './modules/ai-local/ai-local.service';
import { KnowledgeService } from './modules/knowledge/knowledge.service';
import { FileStorageService } from '@common/common/file/file.service';
import { FILE_SERVICE } from '@common/common';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
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
