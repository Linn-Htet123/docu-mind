import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';

export const UploadApiDocument = () =>
  applyDecorators(
    ApiConsumes('multipart/form-data'),
    ApiBody({
      description:
        'Upload one or more documents. Supported formats: **PDF, DOCX**. Max size: **5MB**.',
      schema: {
        type: 'object',
        required: ['files'],
        properties: {
          files: {
            type: 'array',
            items: {
              type: 'string',
              format: 'binary',
            },
          },
        },
      },
    }),
  );
