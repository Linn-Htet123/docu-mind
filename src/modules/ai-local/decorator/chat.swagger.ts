import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export const ChatApiDocument = () =>
  applyDecorators(
    ApiOperation({ summary: 'Chat with the Local AI' }),
    ApiResponse({
      status: 201,
      description: 'AI successfully generated a response.',
    }),
    ApiResponse({
      status: 500,
      description: 'Ollama is offline or unreachable.',
    }),
  );
