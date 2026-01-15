export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10) || 3000,
  environment: process.env.NODE_ENV || 'development',
  ollama: {
    apiUrl: process.env.OLLAMA_API_URL || 'http://localhost:11434/api/chat',
    model: process.env.OLLAMA_MODEL || 'llama3.2',
    systemPrompt:
      process.env.OLLAMA_SYSTEM_PROMPT || 'You are a helpful AI assistant.',
    rewriterModel: process.env.OLLAMA_MODEL_REWRITER || 'qwen2.5:0.5b',
  },
  lancedb: {
    embed_url:
      process.env.OLLAMA_EMBED_URL || 'http://localhost:11434/api/embeddings',
    embed_model: process.env.OLLAMA_MODEL_EMBED || 'nomic-embed-text',
  },
});
