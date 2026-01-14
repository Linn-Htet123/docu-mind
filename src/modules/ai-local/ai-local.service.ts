import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { VectorService } from '../vector/vector.service';
import { getInstructionPrompt } from './helper/instruction';

@Injectable()
export class AiLocalService {
  private readonly logger = new Logger(AiLocalService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly vectorService: VectorService,
  ) {}

  async chat(userMessage: string, modelOverride?: string) {
    const apiUrl = this.configService.get<string>('ollama.apiUrl', {
      infer: true,
    })!;
    const defaultModel = this.configService.get<string>('ollama.model', {
      infer: true,
    });

    this.logger.log(`Searching knowledge base for: "${userMessage}"`);
    const searchResults = await this.vectorService.performSearch(userMessage);

    const contextBlock = searchResults
      .map((r: any) => `--- SOURCE: ${r.filename} ---\n${r.text}`)
      .join('\n\n');

    console.log('Context Block:', contextBlock);

    this.logger.log(`Found ${searchResults.length} relevant chunks.`);
    const systemInstruction = getInstructionPrompt(contextBlock);

    const modelToUse = modelOverride || defaultModel;
    this.logger.log(`Sending prompt to Ollama [Model: ${modelToUse}]`);

    try {
      const { data } = await axios.post(
        apiUrl,
        {
          model: modelToUse,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: userMessage },
          ],
          stream: false,
        },
        { timeout: 60000 },
      );

      return {
        reply: data.message.content,
        model: data.model,

        sources: searchResults.map((r: any) => r.filename),
        duration_sec: data.total_duration / 1e9,
      };
    } catch (error) {
      this.logger.error('Ollama chat failed', error.message);
      throw new InternalServerErrorException(
        'AI Core is unreachable. Is Ollama running?',
      );
    }
  }
}
