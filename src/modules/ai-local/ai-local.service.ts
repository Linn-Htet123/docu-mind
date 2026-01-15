import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Observable } from 'rxjs';
import { VectorService } from '../vector/vector.service';
import { ChatHistoryService } from '../chat-history/chat-history.service';
import { getInstructionPrompt } from './helper/instruction';
import { generateRewritePrompt } from './helper/rewriter';

@Injectable()
export class AiLocalService {
  private readonly logger = new Logger(AiLocalService.name);
  private ollamaUrl: string;
  private defaultModel: string;
  private rewriterModel: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly vectorService: VectorService,
    private readonly historyService: ChatHistoryService,
  ) {
    this.ollamaUrl = this.configService.get<string>('ollama.apiUrl')!;
    this.defaultModel = this.configService.get<string>('ollama.model')!;
    this.rewriterModel =
      this.configService.get<string>('ollama.rewriterModel') || 'qwen2.5:0.5b';
  }


  async chat(userMessage: string, sessionId: string, modelOverride?: string) {
    const model = modelOverride || this.defaultModel;

    const { rawHistory, systemInstruction, uniqueDocs } =
      await this.processRagPipeline(userMessage, sessionId);

    this.logger.log(`Sending blocking request to Ollama [Model: ${model}]`);

    try {
      const { data } = await axios.post(this.ollamaUrl, {
        model: model,
        messages: [
          { role: 'system', content: systemInstruction },
          ...rawHistory.map((m) => ({ role: m.role, content: m.content })),
          { role: 'user', content: userMessage },
        ],
        stream: false, // 👈 Blocking
      });

      const reply = data.message?.content || data.response;

      // B. Save Bot Response
      await this.historyService.addMessage(sessionId, 'assistant', reply);

      return {
        reply,
        model: data.model,
        sources: uniqueDocs.map((d: any) => d.filename),
        duration_sec: data.total_duration ? data.total_duration / 1e9 : 0,
      };
    } catch (error) {
      this.logger.error('Blocking chat failed', error.message);
      throw new InternalServerErrorException('AI Core is unreachable.');
    }
  }

  // ===========================================================================
  // 2. STREAMING CHAT (Observable / Server-Sent Events)
  // ===========================================================================
  async chatStream(
    userMessage: string,
    sessionId: string,
    modelOverride?: string,
  ) {
    const model = modelOverride || this.defaultModel;

    // A. Run the RAG Pipeline (History -> Rewrite -> Search -> Prompt)
    const { rawHistory, systemInstruction, uniqueDocs } =
      await this.processRagPipeline(userMessage, sessionId);

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
              const lines = chunk
                .toString()
                .split('\n')
                .filter((line) => line.trim() !== '');
              for (const line of lines) {
                const json = JSON.parse(line);

                // Emit text chunks
                if (json.message && json.message.content) {
                  const text = json.message.content;
                  fullBotAnswer += text;
                  subscriber.next({ data: { text } });
                }

                // Emit metadata at the end
                if (json.done) {
                  subscriber.next({
                    data: {
                      meta: { sources: uniqueDocs.map((d: any) => d.filename) },
                    },
                  });
                }
              }
            } catch (error) {
              this.logger.error(error);
            }
          });

          stream.on('end', async () => {
            // B. Save Bot Response
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

  // ===========================================================================
  // PRIVATE HELPER: THE "BRAIN" (Shared Logic)
  // ===========================================================================
  private async processRagPipeline(userMessage: string, sessionId: string) {
    const rawHistory = await this.historyService.getHistory(sessionId);

    const recentHistoryText = rawHistory
      .slice(-4)
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n');

    let searchQuery = userMessage;
    const needsRewriting =
      userMessage.split(' ').length < 5 ||
      /\b(he|she|it|that|yes|no)\b/i.test(userMessage);

    if (needsRewriting && recentHistoryText) {
      try {
        const { data } = await axios.post(this.ollamaUrl, {
          model: this.rewriterModel,
          prompt: generateRewritePrompt(recentHistoryText, userMessage),
          stream: false,
          options: { temperature: 0, num_predict: 50 },
        });

        const rewritten =
          data.response?.trim() || data.message?.content?.trim();
        if (rewritten) {
          this.logger.log(`🔄 Rewrote: "${userMessage}" -> "${rewritten}"`);
          searchQuery = rewritten;
        }
      } catch (e) {
        this.logger.warn(
          `Rewriter failed: ${e.message}, using original message`,
        );
      }
    }

    this.logger.log(`Searching knowledge base for: "${searchQuery}"`);
    const searchResults = await this.vectorService.performSearch(searchQuery);

    const uniqueDocs = [
      ...new Map(searchResults.map((item) => [item['text'], item])).values(),
    ];

    const contextBlock = uniqueDocs
      .map((r: any) => `--- SOURCE: ${r.filename} ---\n${r.text}`)
      .join('\n\n');

    // 5. Build System Prompt (With Full History Context for Persona)
    const fullHistoryText = rawHistory
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n');

    const systemInstruction = getInstructionPrompt(
      fullHistoryText,
      contextBlock,
    );

    await this.historyService.addMessage(sessionId, 'user', userMessage);

    return { rawHistory, systemInstruction, uniqueDocs };
  }
}
