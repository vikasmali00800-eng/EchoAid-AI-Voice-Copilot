import { useRef, useState } from "react";
import "./App.css";

type Message = {
  role: "assistant" | "user";
  text: string;
};

type SpeechRecognitionResult = {
  transcript: string;
};

type SpeechRecognitionEvent = {
  results: ArrayLike<ArrayLike<SpeechRecognitionResult>>;
};

type SpeechRecognitionInstance = {
  lang: string;
  start: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hi! I'm EchoAid, your AI Voice Copilot. Ask me a question or upload a PDF to explore its content.",
    },
  ]);

  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);

  const fileInput = useRef<HTMLInputElement>(null);

  function speakText(text: string, index: number) {
    if (!("speechSynthesis" in window)) {
      alert("Voice playback is not supported in this browser. Please try Chrome.");
      return;
    }

    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);

    setSpeakingIndex(index);
    window.speechSynthesis.speak(utterance);
  }

  async function sendMessage() {
    const question = input.trim();

    if (!question || loading || uploading) return;

    setMessages((previous) => [
      ...previous,
      { role: "user", text: question },
    ]);

    setInput("");
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: question,
          document_id: documentId || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "The request failed.");
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: data.answer || "I couldn't generate a response.",
        },
      ]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown connection error.";

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text:
            "I couldn't connect to EchoAid. Check that the backend and Ollama are running. Details: " +
            errorMessage,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleFile(file?: File) {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: "Please upload a PDF file. Other formats are not supported.",
        },
      ]);
      return;
    }

    setUploading(true);
    setFileName(file.name);
    setDocumentId("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:8000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "PDF upload failed.");
      }

      setDocumentId(data.document_id);

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: `${data.filename} uploaded successfully. Extracted text from ${data.pages_extracted} page(s). You can now ask questions about the document. Answers depend on relevant text found by keyword search.`,
        },
      ]);
    } catch (error) {
      setFileName("");
      setDocumentId("");

      const errorMessage =
        error instanceof Error ? error.message : "Unknown upload error.";

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: "PDF upload failed. Check the backend. Details: " + errorMessage,
        },
      ]);
    } finally {
      setUploading(false);

      if (fileInput.current) {
        fileInput.current.value = "";
      }
    }
  }

  function startVoice() {
    const browserWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };

    const SpeechRecognitionAPI =
      browserWindow.SpeechRecognition ||
      browserWindow.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: "Voice recognition is unavailable. Please try Google Chrome.",
        },
      ]);
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "en-IN";

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    setListening(true);

    try {
      recognition.start();
    } catch {
      setListening(false);
    }
  }

  function startNewChat() {
    window.speechSynthesis?.cancel();
    setSpeakingIndex(null);

    setMessages([
      {
        role: "assistant",
        text: "Hi! I'm EchoAid. Ask a question or upload a PDF to get started.",
      },
    ]);

    setInput("");
    setFileName("");
    setDocumentId("");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">E</div>
          <div>
            <h2>EchoAid</h2>
            <span>AI VOICE COPILOT</span>
          </div>
        </div>

        <button className="new-chat" onClick={startNewChat}>
          <span>＋</span> New conversation
        </button>

        <div className="side-label">WORKSPACE</div>
        <div className="nav-item active">◈ &nbsp; AI Assistant</div>
        <div className="nav-item">▤ &nbsp; My Documents</div>
        <div className="nav-item">✧ &nbsp; Study Planner</div>
        <div className="nav-item">◷ &nbsp; History</div>

        <div className="sidebar-bottom">
          <div className="status-dot" />
          <div>
            <strong>EchoAid Workspace</strong>
            <p>{documentId ? "Document ready" : "Development mode"}</p>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="breadcrumb">Workspace / </span>
            <strong>AI Assistant</strong>
          </div>
          <div className="user-avatar">V</div>
        </header>

        <section className="chat-area">
          <div className="welcome">
            <div className="orb">✳</div>
            <div className="eyebrow">YOUR PERSONAL AI COPILOT</div>

            <h1>
              Think less about searching.
              <br />
              <span>Do more with what you know.</span>
            </h1>

            <p>
              Ask questions, explore your documents, and turn ideas into action.
            </p>
          </div>

          <div className="messages">
            {messages.map((message, index) => (
              <div
                key={`${index}-${message.role}`}
                className={`message ${message.role}`}
              >
                <div className="message-avatar">
                  {message.role === "assistant" ? "E" : "V"}
                </div>

                <div className="message-body">
                  <strong>
                    {message.role === "assistant" ? "EchoAid" : "You"}
                  </strong>

                  <p>{message.text}</p>

                  {message.role === "assistant" && (
                    <button
                      type="button"
                      className="speak-button"
                      onClick={() => speakText(message.text, index)}
                    >
                      {speakingIndex === index ? "⏹ Stop voice" : "🔊 Read aloud"}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {(loading || uploading) && (
              <div className="message assistant">
                <div className="message-avatar">E</div>
                <div className="message-body">
                  <strong>EchoAid</strong>
                  <p>{uploading ? "Uploading document..." : "Thinking..."}</p>
                </div>
              </div>
            )}
          </div>

          <div className="composer-wrap">
            {fileName && <div className="file-chip">📄 {fileName}</div>}

            <div className="composer">
              <input
                ref={fileInput}
                type="file"
                accept=".pdf"
                hidden
                onChange={(event) => handleFile(event.target.files?.[0])}
              />

              <button
                type="button"
                className="tool-button"
                title="Upload PDF"
                onClick={() => fileInput.current?.click()}
              >
                ＋
              </button>

              <input
                className="chat-input"
                placeholder="Ask EchoAid anything..."
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void sendMessage();
                }}
              />

              <button
                type="button"
                className={`voice-button ${listening ? "listening" : ""}`}
                title="Voice input"
                onClick={startVoice}
              >
                {listening ? "◉" : "🎙"}
              </button>

              <button
                type="button"
                className="send-button"
                onClick={() => void sendMessage()}
                disabled={loading || uploading}
                title="Send message"
              >
                ↑
              </button>
            </div>

            <p className="disclaimer">
              EchoAid uses a local AI model. Use “Read aloud” to hear assistant
              responses. PDF answers depend on relevant text found by keyword
              search in the uploaded document.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;

