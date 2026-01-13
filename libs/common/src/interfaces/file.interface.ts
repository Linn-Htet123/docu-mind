export abstract class IFileService {
  abstract saveTextFile(
    originalFilename: string,
    content: string,
  ): Promise<string>;
  abstract readFile(fileName: string): Promise<string>;
}

export const FILE_SERVICE = Symbol('FILE_SERVICE');
