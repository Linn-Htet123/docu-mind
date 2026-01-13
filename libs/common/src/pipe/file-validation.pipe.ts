import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  private readonly MAX_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  ];

  transform(value: any) {
    if (!value) {
      throw new BadRequestException('File is required');
    }

    const files = Array.isArray(value) ? value : [value];

    files.forEach((file) => {
      this.validateFileType(file);
      this.validateFileSize(file);
    });

    return value;
  }

  private validateFileType(file: Express.Multer.File) {
    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type: ${file.originalname}. Only PDF and DOCX are allowed.`,
      );
    }
  }

  private validateFileSize(file: Express.Multer.File) {
    if (file.size > this.MAX_SIZE) {
      throw new BadRequestException(
        `File too large: ${file.originalname}. Max size is 5MB.`,
      );
    }
  }
}
