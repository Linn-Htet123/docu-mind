import { Injectable } from '@nestjs/common';
import { parseFileContent } from '@common/common/utils/file.util';
import { VectorService } from '../vector/vector.service';

@Injectable()
export class KnowledgeService {
  constructor(private readonly vectorService: VectorService) {}

  async uploadDocuments(files: Array<Express.Multer.File>): Promise<any[]> {
    const results: any = [];

    await Promise.all(
      files.map(async (file) => {
        try {
          const text = await parseFileContent(file);

          const vectorStats = await this.vectorService.addDocument(
            file.originalname,
            text,
          );

          results.push({
            file: file.originalname,
            status: 'embedded',
            chunks: vectorStats.chunks_processed,
          });
        } catch (error) {
          console.error(`Error processing ${file.originalname}:`, error);
          results.push({
            file: file.originalname,
            status: 'failed',
            error: error.message,
          });
        }
      }),
    );

    return results;
  }
}
