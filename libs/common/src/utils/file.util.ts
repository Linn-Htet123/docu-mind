import * as mammoth from 'mammoth';
import pdfParse = require('pdf-parse-new');

export const parseFileContent = async (
  file: Express.Multer.File,
): Promise<string> => {
  const mimeType = file.mimetype;
  const buffer = file.buffer;

  if (mimeType === 'application/pdf') {
    try {
      const data = await pdfParse.default(buffer);

      const text = data.text.trim();
      if (text.length === 0) throw new Error('PDF content is empty');

      return text;
    } catch (error: any) {
      console.error('PDF Parse Failed:', error);
      throw new Error(`PDF Error: ${error.message}`);
    }
  }

  if (
    mimeType ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const result = await mammoth.extractRawText({ buffer: buffer });
    return result.value;
  }

  if (mimeType === 'text/plain') {
    return buffer.toString('utf-8');
  }

  throw new Error(`Unsupported file type: ${mimeType}`);
};
