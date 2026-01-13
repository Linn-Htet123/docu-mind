import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class AiLocalService {
  private readonly logger = new Logger(AiLocalService.name);

  // Point to the same folder where you save files
  private readonly storagePath = path.join(process.cwd(), 'knowledge_files');

  constructor(private readonly configService: ConfigService) {}

  // 1. Helper to read ALL uploaded text files
  private async loadGlobalKnowledge(): Promise<string> {
    try {
      // Check if folder exists
      await fs.access(this.storagePath);

      const files = await fs.readdir(this.storagePath);
      const txtFiles = files.filter((f) => f.endsWith('.txt'));

      if (txtFiles.length === 0) return '';

      const contents = await Promise.all(
        txtFiles.map(async (file) => {
          const filePath = path.join(this.storagePath, file);
          const text = await fs.readFile(filePath, 'utf-8');
          return `\n--- SOURCE: ${file} ---\n${text}`;
        }),
      );

      return contents.join('\n');
    } catch (error: any) {
      this.logger.warn('No knowledge base found or empty.', error);
      return '';
    }
  }

  async chat(userMessage: string, modelOverride?: string) {
    const apiUrl = this.configService.get<string>('ollama.apiUrl', {
      infer: true,
    })!;
    const defaultModel = this.configService.get<string>('ollama.model', {
      infer: true,
    });

    // 2. Load the file content
    let knowledgeBase = await this.loadGlobalKnowledge();

    // 3. Safety Truncate (Limit to ~16k chars to prevent crashing Llama 3)
    // If you upload too many files, we cut off the oldest parts for the demo.
    const MAX_CHARS = 16000;
    if (knowledgeBase.length > MAX_CHARS) {
      this.logger.warn(
        `Knowledge base too large (${knowledgeBase.length} chars). Truncating.`,
      );
      knowledgeBase =
        knowledgeBase.substring(0, MAX_CHARS) + '\n...[TRUNCATED]';
    }

    const modelToUse = modelOverride || defaultModel;

    // 4. Construct the Smart Prompt
    const systemInstruction = `
      You are an intelligent assistant.
      Use the provided KNOWLEDGE BASE below to answer the user's question.
      If the answer is found in the documents, cite the source file.
      If not found, use your general knowledge but mention it was not in the files.
      
      === KNOWLEDGE BASE START ===
      ${knowledgeBase}
      === KNOWLEDGE BASE END ===
    `;

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
        // 5. Increased timeout because reading files + AI takes time
        { timeout: 120000 },
      );

      return {
        reply: data.message.content,
        model: data.model,
        duration_sec: data.total_duration / 1e9,
        knowledge_size: knowledgeBase.length, // Useful for debugging
      };
    } catch (error) {
      this.logger.error('Ollama connection failed', error.message);
      throw new InternalServerErrorException(
        'AI Core is unreachable. Is Ollama running?',
      );
    }
  }
}
