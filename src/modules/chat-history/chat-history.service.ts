import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from './entities/chat-message.entity';

@Injectable()
export class ChatHistoryService {
  constructor(
    @InjectRepository(ChatMessage)
    private chatRepo: Repository<ChatMessage>,
  ) {}

  async addMessage(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string,
  ) {
    const newMessage = this.chatRepo.create({
      sessionId,
      role,
      content,
    });
    return await this.chatRepo.save(newMessage);
  }

  async getHistory(sessionId: string): Promise<ChatMessage[]> {
    const rawHistory = await this.chatRepo.find({
      where: { sessionId },
      order: { createdAt: 'DESC' },
      take: 30,
    });

    return rawHistory.reverse();
  }

  async clearHistory(sessionId: string) {
    await this.chatRepo.delete({ sessionId });
  }
}
