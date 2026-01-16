export const chunkText = (chunk: Buffer): string[] => {
    return chunk.toString()
        .split('\n')
        .filter((line) => line.trim() !== '');
}

export const sanitizeText = (text: string): string => {
    return text
        // Remove null bytes and other control characters (keep newlines/tabs)
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}