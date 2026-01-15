import { FileValidationPipe } from '@common/common/pipe';
import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadApiDocument } from './decorator/upload.swagger';
import { KnowledgeService } from './knowledge.service';
import { SuccessResponse } from '@common/common';

@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) { }
  @Post('upload')
  @UploadApiDocument()
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadDocuments(
    @UploadedFiles(new FileValidationPipe()) files: Array<Express.Multer.File>,
  ) {

    const results: any[] = await this.knowledgeService.uploadDocuments(files);

    return new SuccessResponse(
      {
        processed: results.length,
        details: results,
      },
      'Documents uploaded successfully',
    );
  }
}
