import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaRobot, FaArrowLeft, FaPaperPlane, FaUser } from "react-icons/fa";
import { aiApi } from "../services/aiApi";
import "./AIChatbot.css";

export default function AIChatbot() {
  const navigate = useNavigate();

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm your Lost & Found AI Assistant. I can help you report, search, match, or claim a lost item.",
    },
  ]);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const suggestedQuestions = [
    "How do I report a lost item?",
    "How can I search for my item?",
    "How does AI matching work?",
    "How do I claim a found item?",
  ];

  async function sendMessage(text) {
    const cleanMessage = text.trim();

    if (!cleanMessage || loading) return;

    const nextMessages = [
      ...messages,
      {
        role: "user",
        content: cleanMessage,
      },
    ];

    setMessages(nextMessages);
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const { reply } = await aiApi.chat(cleanMessage, messages);

      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: reply,
        },
      ]);
    } catch (err) {
      const errorMessage = err.message || "Unable to contact the AI service.";

      setError(errorMessage);

      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content:
            "I'm temporarily unable to connect to the AI service. Please try again later or continue using the Lost & Found system.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await sendMessage(message);
  }

  function handleSuggestion(question) {
    sendMessage(question);
  }

  return (
    <main className="chat-page">
      <section className="chat-card">

        {/* HEADER */}
        <header className="chat-header">
          <button
            className="chat-back-button"
            onClick={() => navigate("/dashboard")}
            aria-label="Back to dashboard"
          >
            <FaArrowLeft />
          </button>

          <div className="chat-title-area">
            <div className="ai-avatar">
              <FaRobot />
              <span className="online-dot"></span>
            </div>

            <div>
              <p className="chat-eyebrow">AI ASSISTANT</p>
              <h1>Lost & Found Help</h1>
              <span className="online-status">
                AI assistant
              </span>
            </div>
          </div>
        </header>

        {/* CHAT AREA */}
        <div className="messages" aria-live="polite">

          {messages.map((entry, index) => (
            <div
              key={`${entry.role}-${index}`}
              className={`message-row ${entry.role}`}
            >

              {entry.role === "assistant" && (
                <div className="small-avatar ai-small-avatar">
                  <FaRobot />
                </div>
              )}

              <div className={`message ${entry.role}`}>
                {entry.content}
              </div>

              {entry.role === "user" && (
                <div className="small-avatar user-small-avatar">
                  <FaUser />
                </div>
              )}

            </div>
          ))}

          {/* TYPING INDICATOR */}
          {loading && (
            <div className="message-row assistant">

              <div className="small-avatar ai-small-avatar">
                <FaRobot />
              </div>

              <div className="message assistant typing-message">
                <span></span>
                <span></span>
                <span></span>
              </div>

            </div>
          )}

        </div>

        {/* SUGGESTIONS */}
        {messages.length === 1 && !loading && (
          <div className="suggestions">

            <p>Try asking:</p>

            <div className="suggestion-list">
              {suggestedQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => handleSuggestion(question)}
                >
                  {question}
                </button>
              ))}
            </div>

          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="chat-error">
            <strong>AI service unavailable</strong>
            <span>
              The AI service may have reached its usage limit.
            </span>
          </div>
        )}

        {/* INPUT */}
        <form className="chat-form" onSubmit={handleSubmit}>

          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Ask about Lost & Found..."
            aria-label="Chat message"
            disabled={loading}
          />

          <button
            type="submit"
            disabled={loading || !message.trim()}
            aria-label="Send message"
          >
            <FaPaperPlane />
          </button>

        </form>

        {/* PRIVACY */}
        <div className="privacy-note">
          🔒 Never share passwords, banking details, authentication
          codes, or full identification numbers.
        </div>

      </section>
    </main>
  );
}