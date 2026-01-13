import {
  Body,
  Controller,
  Post,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'; // 👈 Import
import { AiLocalService } from './ai-local.service';
import { ChatRequestDto } from './dto/chat-request.dto';

@ApiTags('AI')
@Controller('ai')
export class AiLocalController {
  constructor(private readonly aiService: AiLocalService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Chat with the Local AI' })
  @ApiResponse({
    status: 201,
    description: 'AI successfully generated a response.',
  })
  @ApiResponse({
    status: 500,
    description: 'Ollama is offline or unreachable.',
  })
  @UsePipes(new ValidationPipe())
  async chat(@Body() chatDto: ChatRequestDto) {
    return this.aiService.chat(chatDto.message, chatDto.model);
  }
}
