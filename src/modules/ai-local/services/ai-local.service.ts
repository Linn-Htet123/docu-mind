import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Observable } from 'rxjs';
import { ChatHistoryService } from '../../chat-history/chat-history.service';
import { PipelineService } from './pipeline.service';
import { chunkText } from '@common/common/utils/text.util';
import { SuccessResponse } from '@common/common';

@Injectable()
export class AiLocalService {
  private readonly logger = new Logger(AiLocalService.name);
  private ollamaUrl: string;
  private defaultModel: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly pipelineService: PipelineService,
    private readonly historyService: ChatHistoryService,
  ) {
    this.ollamaUrl = this.configService.get<string>('ollama.apiUrl')!;
    this.defaultModel = this.configService.get<string>('ollama.model')!;
  }


  async chat(userMessage: string, sessionId: string, modelOverride?: string) {
    const model = modelOverride || this.defaultModel;

    const { rawHistory, systemInstruction, uniqueDocs } =
      await this.pipelineService.processRagPipeline(userMessage, sessionId);

    this.logger.log(`Sending blocking request to Ollama [Model: ${model}]`);

    try {
      const { data } = await axios.post(this.ollamaUrl, {
        model: model,
        messages: [
          { role: 'system', content: systemInstruction },
          ...rawHistory.map((m) => ({ role: m.role, content: m.content })),
          { role: 'user', content: userMessage },
        ],
        stream: false,
      });

      const reply = data.message?.content || data.response;
      await this.historyService.addMessage(sessionId, 'assistant', reply);

      return new SuccessResponse({
        reply,
        model: data.model,
        sources: Array.from(new Set(uniqueDocs.map((d: any) => d.filename))),
        duration_sec: data.total_duration ? data.total_duration / 1e9 : 0,
      });

    } catch (error) {
      this.logger.error('Blocking chat failed', error.message);
      throw new InternalServerErrorException('AI Core is unreachable.');
    }
  }


  async chatStream(
    userMessage: string,
    sessionId: string,
    modelOverride?: string,
  ) {
    const model = modelOverride || this.defaultModel;
    const { rawHistory, systemInstruction, uniqueDocs } =
      await this.pipelineService.processRagPipeline(userMessage, sessionId);
    return new Observable((subscriber) => {
      let fullBotAnswer = '';

      axios({
        method: 'post',
        url: this.ollamaUrl,
        data: {
          model: model,
          messages: [
            { role: 'system', content: systemInstruction },
            ...rawHistory.map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMessage },
          ],
          keep_alive: '10m',
          stream: true,
        },
        responseType: 'stream',
      })
        .then((response) => {
          const stream = response.data;

          stream.on('data', (chunk: Buffer) => {
            try {
              const lines = chunkText(chunk)

              for (const line of lines) {
                const json = JSON.parse(line);


                if (json.message && json.message.content) {
                  const text = json.message.content;
                  fullBotAnswer += text;
                  subscriber.next({ data: { reply: text } });
                }


                if (json.done) {
                  subscriber.next({
                    reply: fullBotAnswer,
                    model,
                    sources: Array.from(new Set(uniqueDocs.map((d: any) => d.filename))),
                    duration_sec: json.total_duration ? json.total_duration / 1e9 : 0,

                  });
                }
              }
            } catch (error) {
              this.logger.error(error);
            }
          });

          stream.on('end', async () => {

            await this.historyService.addMessage(
              sessionId,
              'assistant',
              fullBotAnswer,
            );
            subscriber.complete();
          });

          stream.on('error', (err) => subscriber.error(err));
        })
        .catch((err) => subscriber.error(err));
    });
  }

}
