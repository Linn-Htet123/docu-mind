import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as lancedb from '@lancedb/lancedb';
import axios from 'axios';
import { Schema, Field, Float32, FixedSizeList, Utf8 } from 'apache-arrow';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class VectorService implements OnModuleInit {
  private db: lancedb.Connection;
  private table: lancedb.Table;
  private readonly logger = new Logger(VectorService.name);

  private ollamaUrl: string;
  private embedModel: string;

  private readonly dbPath = path.join(
    process.cwd(),
    'knowledge_files',
    'lancedb',
  );

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.ollamaUrl = this.configService.get<string>('lancedb.embed_url')!;
    this.embedModel = this.configService.get<string>('lancedb.embed_model')!;

    await fs.mkdir(this.dbPath, { recursive: true });
    this.logger.log(`📂 Connecting to Local LanceDB at: ${this.dbPath}`);

    this.db = await lancedb.connect(this.dbPath);
    this.logger.log('✅ Connected to Local DB');

    const tableName = 'documents';
    try {
      this.table = await this.db.openTable(tableName);
      this.logger.log(`✅ Table '${tableName}' ready.`);
    } catch {
      this.logger.warn(
        `Table '${tableName}' not found. Creating with Schema...`,
      );
      await this.createTableWithSchema(tableName);
    }
  }

  private async createTableWithSchema(tableName: string) {
    const sampleVector = await this.getEmbedding('init_schema_check');
    const dimensions = sampleVector.length;

    this.logger.log(`Model '${this.embedModel}' has ${dimensions} dimensions.`);

    const schema = new Schema([
      new Field(
        'vector',
        new FixedSizeList(dimensions, new Field('float32', new Float32())),
      ),
      new Field('text', new Utf8()),
      new Field('filename', new Utf8()),
    ]);

    this.table = await this.db.createTable({
      name: tableName,
      schema: schema,
      data: [],
    });

    this.logger.log(
      `✅ Table '${tableName}' created with ${dimensions}-dim schema.`,
    );
  }

  private async getEmbedding(text: string): Promise<number[]> {
    try {
      const { data } = await axios.post(this.ollamaUrl, {
        model: this.embedModel,
        prompt: text,
      });
      return data.embedding;
    } catch (error) {
      this.logger.error(
        `Ollama Error. Is '${this.embedModel}' pulled?`,
        error.message,
      );
      throw new Error('Embedding failed');
    }
  }

  async addDocument(filename: string, fullText: string) {
    // Chunking logic
    const chunks = fullText
      .split(/\n\s*\n/)
      .filter((c) => c.trim().length > 50);

    const records: any[] = [];

    for (const chunk of chunks) {
      const vector = await this.getEmbedding(chunk);
      records.push({
        vector: vector,
        text: chunk,
        filename: filename,
      });
    }

    if (records.length > 0) {
      await this.table.add(records);
    }
    return { chunks_processed: records.length };
  }

  async performSearch(query: string) {
    const queryVector = await this.getEmbedding(query);
    const results = await this.table
      .vectorSearch(queryVector)
      .limit(3)
      .toArray();
    return results;
  }
}
