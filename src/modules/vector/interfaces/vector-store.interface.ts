export interface IVectorStore {
    addDocuments(
        documents: { text: string; metadata: Record<string, any> }[],
    ): Promise<any>;
    search(query: string, limit?: number): Promise<any[]>;
}
