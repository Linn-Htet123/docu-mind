export const chunkText = (chunk: Buffer): string[] => {
    return chunk.toString()
        .split('\n')
        .filter((line) => line.trim() !== '');
}