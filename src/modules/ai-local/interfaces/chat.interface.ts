export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaChatRequest {
  model: string;
  messages: OllamaMessage[];
  stream: boolean;
  keep_alive?: string;
  options?: {
    temperature?: number;
    num_predict?: number;
  };
}

export interface OllamaChatResponse {
  message?: {
    content: string;
  };
  response?: string;
  model: string;
  total_duration?: number;
  done?: boolean;
}

export interface ChatResponse {
  reply: string;
  model: string;
  sources: string[];
  duration_sec: number;
}

export interface StreamChunk {
  data: {
    text?: string;
    meta?: {
      sources: string[];
    };
  };
}

export interface SearchDocument {
  text: string;
  filename: string;
  vector?: number[];
}

export interface RagPipelineResult {
  rawHistory: Array<{ role: string; content: string }>;
  systemInstruction: string;
  uniqueDocs: SearchDocument[];
}
