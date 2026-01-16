import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as lancedb from '@lancedb/lancedb';
import { Schema, Field, Float32, FixedSizeList, Utf8 } from 'apache-arrow';
import * as path from 'path';
import * as fs from 'fs/promises';
import axios from 'axios';
import { IVectorStore } from '../interfaces/vector-store.interface';

@Injectable()
export class LanceDbStore implements IVectorStore, OnModuleInit {
  private static isInitializing = false;
  private db: lancedb.Connection;
  private table: lancedb.Table;
  private readonly logger = new Logger(LanceDbStore.name);

  private ollamaUrl: string;
  private embedModel: string;

  private readonly dbPath = path.join(
    process.cwd(),
    'knowledge_files',
    'lancedb',
  );

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    if (LanceDbStore.isInitializing) {
      this.logger.warn('LanceDB is already initializing. Skipping...');
      return;
    }
    LanceDbStore.isInitializing = true;

    this.ollamaUrl = this.configService.get<string>('lancedb.embed_url')!;
    this.embedModel = this.configService.get<string>('lancedb.embed_model')!;

    await fs.mkdir(this.dbPath, { recursive: true });
    this.logger.log(`📂 Connecting to Local LanceDB at: ${this.dbPath}`);

    this.db = await lancedb.connect(this.dbPath);
    this.logger.log('Connected to Local DB');

    const tableName = 'documents';
    const existingTables = await this.db.tableNames();

    if (existingTables.includes(tableName)) {
      this.table = await this.db.openTable(tableName);
      this.logger.log(`Table '${tableName}' ready.`);
    } else {
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
      `Table '${tableName}' created with ${dimensions}-dim schema.`,
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

  async addDocuments(
    documents: { text: string; metadata: Record<string, any> }[],
  ): Promise<any> {
    const records = await Promise.all(
      documents.map(async (doc) => {
        const vector = await this.getEmbedding(doc.text);
        return {
          vector,
          text: doc.text,
          filename: doc.metadata.filename,
        };
      }),
    );

    if (records.length > 0) {
      await this.table.add(records);
    }

    return records.length;
  }

  async search(query: string, limit?: number): Promise<any[]> {
    const queryVector = await this.getEmbedding(query);
    const results = await this.table
      .vectorSearch(queryVector)
      .limit(limit || 10)
      .toArray();
    return results;
  }
}
