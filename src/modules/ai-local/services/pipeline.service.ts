import { Injectable, Logger } from '@nestjs/common';
import { ChatHistoryService } from 'src/modules/chat-history/chat-history.service';
import { ConfigService } from '@nestjs/config';
import { VectorService } from '../../vector/vector.service';
import { getInstructionPrompt } from '../helper/instruction';
import { generateRewritePrompt } from '../helper/rewriter';
import ollama from 'ollama';
import { ChatMessage } from 'src/modules/chat-history/entities/chat-message.entity';

@Injectable()
export class PipelineService {
  private readonly logger = new Logger(PipelineService.name);
  private rewriterModel: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly vectorService: VectorService,
    private readonly historyService: ChatHistoryService,
  ) {
    this.rewriterModel =
      this.configService.get<string>('ollama.rewriterModel') || 'qwen2.5:0.5b';
  }

  async processRagPipeline(userMessage: string, sessionId: string) {
    const needsRewriting = this.needsRewriting(userMessage);

    let rawHistory: ChatMessage[] = [];
    let recentHistoryText = '';
    if (sessionId && needsRewriting) {
      rawHistory = await this.historyService.getHistory(sessionId);
    }

    if (rawHistory.length !== 0) {
      recentHistoryText = this.getRecentHistoryText(rawHistory);
    }

    let searchQuery = userMessage;

    if (needsRewriting && recentHistoryText) {
      try {
        const rewritePrompt = generateRewritePrompt(
          recentHistoryText,
          userMessage,
        );
        const data = await ollama.chat({
          model: this.rewriterModel,
          messages: [
            { role: 'system', content: rewritePrompt },
            ...rawHistory.map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMessage },
          ],
          stream: false,
          options: { temperature: 0, num_predict: 50 },
        });

        const rewritten = data.message?.content?.trim();
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

    const contextBlock = this.formatContext(uniqueDocs);
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

  private needsRewriting(message: string): boolean {
    const trimmed = message.trim().toLowerCase();

    const hasReferences =
      /\b(he|him|his|she|her|hers|it|its|they|them|their|theirs|that|this|those|these|one|ones)\b/i.test(
        message,
      );
    const isContinuation =
      /^(and|but|so|or|also|plus|besides|additionally|furthermore|moreover|what about|how about|tell me (more|about)|i mean|more on|explain that|regarding|speaking of|as for)\b/i.test(
        trimmed,
      );
    const isVagueRequest =
      /\b(more|elaborate|explain|clarify|expand|continue|go on|details?|deeper|further|specific)\b/i.test(
        trimmed,
      ) && message.split(/\s+/).length < 8;
    const isAcknowledgment =
      /^(yes|no|yeah|yep|nope|yup|nah|ok|okay|sure|right|exactly|correct|true|false|agreed|got it|i see|makes sense)\b/i.test(
        trimmed,
      );
    const hasComparatives =
      /\b(other|another|different|same|similar|like that|such as)\b/i.test(
        trimmed,
      ) && message.split(/\s+/).length < 7;
    const isIncompleteQuestion =
      /^(why|when|where|how|what|which|who)(\s+(about|so|then|else|now))?[\?\s]*$/i.test(
        trimmed,
      );
    const isFormatDirective =
      /^(in|as|with|make it|format|use|show me|give me|list|bullet|short|brief|summary|table)/i.test(
        trimmed,
      ) && message.split(/\s+/).length < 6;
    const isShort = message.split(/\s+/).length < 5;

    return (
      hasReferences ||
      isContinuation ||
      isVagueRequest ||
      isAcknowledgment ||
      hasComparatives ||
      isIncompleteQuestion ||
      isFormatDirective ||
      isShort
    );
  }

  private getRecentHistoryText(rawHistory: ChatMessage[]): string {
    return rawHistory
      .slice(-4)
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n');
  }

  private formatContext(uniqueDocs: any[]): string {
    return uniqueDocs
      .map((r: any) => `--- SOURCE: ${r.filename} ---\n${r.text}`)
      .join('\n\n');
  }
}
