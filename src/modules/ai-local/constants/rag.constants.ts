/**
 * RAG Pipeline Configuration Constants
 */
export const RAG_CONSTANTS = {
  // Number of recent messages to use for query rewriting context
  RECENT_HISTORY_LIMIT: 4,

  // Minimum word count to trigger query rewriting
  MIN_WORDS_FOR_REWRITE: 5,

  // Regex pattern to detect vague references that need rewriting
  VAGUE_REFERENCE_PATTERN: /\b(he|she|it|that|yes|no)\b/i,

  // Ollama rewriter options
  REWRITER_OPTIONS: {
    temperature: 0,
    num_predict: 50,
  },

  // Keep alive duration for streaming
  STREAM_KEEP_ALIVE: '10m',
} as const;
