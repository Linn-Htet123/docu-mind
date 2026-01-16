import { Injectable, Inject } from '@nestjs/common';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import type { IVectorStore } from './interfaces/vector-store.interface';
import { sanitizeText } from '@common/common/utils/text.util';

@Injectable()
export class VectorService {
  constructor(
    @Inject('VECTOR_STORE') private readonly vectorStore: IVectorStore,
  ) { }

  async addDocument(filename: string, fullText: string) {
    const cleanText = sanitizeText(fullText);
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ['\n\n', '\n', '. ', '!', '? ', ' - ', ' – ', ': ', ' ', ''],
      keepSeparator: true,
    });

    const docs = await splitter.createDocuments([cleanText], [{ filename }]);

    const documentsToAdd = docs.map((doc) => ({
      text: doc.pageContent,
      metadata: doc.metadata,
    }));

    const count = await this.vectorStore.addDocuments(documentsToAdd);

    return {
      chunks_processed: count,
      filename,
      original_length: fullText.length,
    };
  }

  async performSearch(query: string) {
    return this.vectorStore.search(query);
  }
}
