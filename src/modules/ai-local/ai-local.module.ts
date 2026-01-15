import { Module } from "@nestjs/common";
import { AiLocalService } from "./services/ai-local.service";
import { PipelineService } from "./services/pipeline.service";
import { ChatHistoryModule } from "../chat-history/chat-history.module";
import { VectorService } from "../vector/vector.service";
import { AiLocalController } from "./ai-local.controller";

@Module({
    imports: [ChatHistoryModule],
    providers: [AiLocalService, PipelineService, VectorService],
    exports: [AiLocalService],
    controllers: [AiLocalController]
})
export class AiLocalModule { }