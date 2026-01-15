import {
  Body,
  Controller,
  Post,
  ValidationPipe,
  UsePipes,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AiLocalService } from './ai-local.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { type Response } from 'express';
import { ChatApiDocument } from './decorator/chat.swagger';
import { ChatStreamApiDocument } from './decorator/chat-stream.swagger';

@ApiTags('AI')
@Controller('ai')
export class AiLocalController {
  constructor(private readonly aiService: AiLocalService) {}

  @Post('chat')
  @ChatApiDocument()
  @UsePipes(new ValidationPipe())
  async chat(@Body() chatDto: ChatRequestDto) {
    return this.aiService.chat(
      chatDto.message,
      chatDto.sessionId,
      chatDto.model,
    );
  }

  @Post('stream')
  @ChatStreamApiDocument()
  async streamChat(@Body() body: ChatRequestDto, @Res() res: Response) {
    const observable = await this.aiService.chatStream(
      body.message,
      body.sessionId,
      body.model,
    );

    const subscription = observable.subscribe({
      next: (payload: any) => {
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      },
      error: (err: any) => {
        console.error('Stream Error:', err);
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        res.end();
      },
      complete: () => {
        res.end();
      },
    });

    res.on('close', () => {
      subscription.unsubscribe();
    });
  }
}
