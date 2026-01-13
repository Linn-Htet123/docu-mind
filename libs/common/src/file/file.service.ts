import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { IFileService } from '../interfaces';

@Injectable()
export class FileStorageService implements OnModuleInit, IFileService {
  private readonly logger = new Logger(FileStorageService.name);

  private readonly storagePath = path.join(process.cwd(), 'knowledge_files');

  async onModuleInit() {
    try {
      await fs.mkdir(this.storagePath, { recursive: true });
      this.logger.log(`Storage ready at: ${this.storagePath}`);
    } catch (error) {
      this.logger.error('Failed to initialize storage', error);
    }
  }

  async saveTextFile(
    originalFilename: string,
    content: string,
  ): Promise<string> {
    const timestamp = Date.now();
    const safeName = path
      .parse(originalFilename)
      .name.replace(/[^a-z0-9]/gi, '_');
    const fileName = `${safeName}_${timestamp}.txt`;

    const filePath = path.join(this.storagePath, fileName);

    await fs.writeFile(filePath, content, 'utf-8');

    return fileName;
  }

  async readFile(fileName: string): Promise<string> {
    return fs.readFile(path.join(this.storagePath, fileName), 'utf-8');
  }
}
