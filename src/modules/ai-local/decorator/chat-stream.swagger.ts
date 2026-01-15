import { applyDecorators, Header } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

export const ChatStreamApiDocument = () =>
  applyDecorators(
    ApiOperation({ summary: 'Chat with Local AI (Streaming)' }),
    Header('Content-Type', 'text/event-stream'),
    Header('Cache-Control', 'no-cache'),
    Header('Connection', 'keep-alive'),
  );
