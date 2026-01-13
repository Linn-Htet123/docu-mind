import { FileValidationPipe } from '@common/common/pipe';
import {
  Controller,
  Inject,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadApiDocument } from './decorator/upload.swagger';
import { FILE_SERVICE, IFileService } from '@common/common';
import { parseFileContent } from '@common/common/utils/file.util';

@Controller('knowledge')
export class KnowledgeController {
  constructor(@Inject(FILE_SERVICE) private fileStorage: IFileService) {}
  @Post('upload')
  @UploadApiDocument()
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadDocuments(
    @UploadedFiles(new FileValidationPipe()) files: Array<Express.Multer.File>,
  ) {
    const results: any = [];

    console.log(
      'Received files:',
      files.map((f) => f.buffer),
    );
    await Promise.all(
      files.map(async (file) => {
        try {
          const text = await parseFileContent(file);
          const savedName = await this.fileStorage.saveTextFile(
            file.originalname,
            text,
          );

          results.push({
            file: file.originalname,
            status: 'saved',
            id: savedName,
          });
        } catch (error) {
          results.push({
            file: file.originalname,
            status: 'failed',
            error: error.message,
          });
        }
      }),
    );

    return { processed: results.length, details: results };
  }
}
