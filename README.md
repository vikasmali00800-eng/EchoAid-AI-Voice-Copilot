# EchoAid — AI Voice Copilot for Documents

EchoAid is an AI-powered document assistant that helps users explore PDF documents through natural-language questions and voice interaction.

## Features

* 📄 **PDF Upload:** Upload readable PDF documents.
* 🤖 **AI Question Answering:** Ask questions about the uploaded document.
* 📝 **Document Summaries:** Generate summaries and find key information.
* 🔎 **Source References:** Display available source page references.
* 🎙️ **Voice Input:** Ask questions using browser-based speech recognition.
* 🔊 **Read Aloud:** Listen to AI-generated responses.

## Tech Stack

### Frontend

* React
* TypeScript
* Vite

### Backend

* Python
* FastAPI
* PyMuPDF for PDF text extraction
* Ollama
* Llama 3.2 (3B)

## How It Works

1. Upload a readable PDF.
2. EchoAid extracts the document text.
3. Ask a question or request a summary.
4. The backend retrieves relevant text passages.
5. The local language model generates a response using the retrieved context.
6. Review available source references and use Read Aloud if needed.

## Getting Started

### Prerequisites

Install the following:

* Python 3.11
* Node.js and npm
* Ollama

Pull the model:

```bash
ollama pull llama3.2:3b
```

### 1. Start the Backend

Open a terminal and navigate to the backend directory:

```bash
cd backend
```

Create and activate a virtual environment, then install the dependencies listed in your project's requirements file.

Start the FastAPI server:

```bash
python -m uvicorn main:app --reload --port 8000
```

Backend API documentation:

http://127.0.0.1:8000/docs

### 2. Start the Frontend

Open another terminal and navigate to the frontend directory:

```bash
cd frontend
npm install
npm run dev
```

Open the local address displayed by Vite, usually:

http://localhost:5173

## Limitations

* PDF text extraction works best with readable, text-based PDFs.
* Scanned PDFs may require OCR support.
* Answers depend on the text retrieved from the document and may not always be accurate.
* The current implementation stores uploaded document data in memory, so restarting the backend may clear it.
* The application runs locally and requires the configured Ollama model.

## Future Improvements

* Semantic search and vector embeddings
* OCR support for scanned PDFs
* Improved source citations
* Multilingual voice interaction
* Cloud deployment

## License

See the LICENSE file in this repository for the applicable open-source license.
