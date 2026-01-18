# DocuMind - Portfolio Chatbot

DocuMind is a high-performance, personalized portfolio chatbot built with **NestJS**, **LanceDB**, and local LLMs via **Ollama**. It allows you to transform your resume and projects into a searchable knowledge base, enabling visitors to interact with your professional history through a natural, first-person AI representative.

## 🚀 Features

- **Local-First AI**: Powered by Ollama for privacy and performance.
- **RAG Implementation**: Uses Retrieval-Augmented Generation (RAG) with LanceDB for accurate document-based answers.
- **Dynamic Context**: Rewrites user queries to resolve context and pronouns.
- **Persistent Chat History**: Stores conversations in a local SQLite database.
- **Document Ingestion**: Built-in API for uploading and processing PDFs/Docs.

## 🛠️ Tech Stack

- **Backend**: [NestJS](https://nestjs.com/)
- **Vector DB**: [LanceDB](https://lancedb.com/)
- **Database**: SQLite (TypeORM)
- **AI Engine**: [Ollama](https://ollama.com/)
- **Embedding**: `nomic-embed-text`

---

## 📋 Prerequisites

Ensure you have the following installed:

1.  **Node.js** (v20 or higher)
2.  **Ollama**: [Download and install](https://ollama.com/)
    - Pull required models:
      ```bash
      ollama pull llama3.2
      ollama pull qwen2.5:0.5b
      ollama pull nomic-embed-text
      ```

## ⚙️ Project Setup

### 1. Installation

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory and configure the following variables (defaults shown):

```env
PORT=3000
NODE_ENV=development

# Ollama Configuration
OLLAMA_API_URL=http://localhost:11434/api/chat
OLLAMA_EMBED_URL=http://localhost:11434/api/embeddings
OLLAMA_MODEL=llama3.2
OLLAMA_MODEL_REWRITE=qwen2.5:0.5b
OLLAMA_MODEL_EMBED=nomic-embed-text
```

### 3. Run the Project

```bash
# Development (watch mode)
npm run start:dev

# Production mode
npm run start:prod
```

---

## 📖 Usage

### Data Ingestion
To populate the knowledge base, upload your documents (PDF, DOCX) to the ingestion endpoint:
- **Endpoint**: `POST /knowledge/upload`
- **Payload**: `Multipart/form-data` with field `files`

### Chatting
Interact with the chatbot via the UI or directly through the AI module endpoints.

### Cleaning Data
If you need to wipe out all vector data and chat history:

```bash
npm run clean:data
```

---

## 🏗️ Architecture

- `src/modules/ai-local`: Core AI logic, prompt engineering, and LLM orchestration.
- `src/modules/vector`: Vector store implementation using LanceDB.
- `src/modules/chat-history`: Session management and history persistence.
- `src/modules/knowledge`: Document processing and embedding pipeline.
