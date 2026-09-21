import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bot, Loader2, MessageSquare, Send, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "react-toastify";

import { useAuth } from "../../context/AuthContext";
import portalAssistantAPI from "../../api/portalAssistant.api";
import {
  getAssistantGreeting,
  getAssistantPlaceholder,
  getAssistantSuggestions,
} from "./suggestions";
import "./PortalAssistant.css";

/* =========================================================
   ERROR MESSAGES
   Map transport/HTTP failures to calm, human copy. Never
   surface raw backend errors or stack traces to the user.
========================================================= */

function errorMessageFor(error) {
  if (error?.code === "ECONNABORTED") {
    return "The portal took too long to respond. Please try again.";
  }

  if (!error?.response) {
    return "Could not reach the portal. Please check your connection and try again.";
  }

  switch (error.response.status) {
    case 400:
      return "I couldn't understand that request. Please rephrase and try again.";
    case 401:
      return "Your session has expired. Please sign in again.";
    case 403:
      return "You don't have permission to access that information.";
    case 404:
      return "I couldn't find anything for that request.";
    case 429:
      return "Too many requests right now. Please wait a moment and try again.";
    case 500:
    case 502:
    case 503:
      return "Something went wrong while checking the portal. Please try again.";
    default:
      return "Something went wrong while checking the portal. Please try again.";
  }
}

/* Roles the backend's /ai/chat route allows (ALL_PORTAL_ROLES). */
const ALLOWED_ROLES = new Set([
  "developer",
  "admin",
  "principal",
  "hoa",
  "secretary",
  "teacher",
  "student",
]);

const DEFAULT_ROLE = "student";

/* =========================================================
   PORTAL ASSISTANT
========================================================= */

export default function PortalAssistant() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const role = user?.role?.toLowerCase() || DEFAULT_ROLE;
  const allowed = ALLOWED_ROLES.has(role);

  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messageIdRef = useRef(0);

  const greeting = useMemo(() => getAssistantGreeting(role), [role]);
  const placeholder = useMemo(() => getAssistantPlaceholder(role), [role]);
  const suggestions = useMemo(() => getAssistantSuggestions(role), [role]);

  const nextId = useCallback(() => {
    messageIdRef.current += 1;
    return messageIdRef.current;
  }, []);

  /* Reset the conversation whenever the signed-in user changes so one
     user's history never leaks into another session. */
  useEffect(() => {
    setMessages([]);
    setInput("");
  }, [user?.id, role]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const timer = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  const appendMessage = useCallback(
    (message) => {
      setMessages((prev) => [...prev, { id: nextId(), ...message }]);
    },
    [nextId],
  );

  const sendMessage = useCallback(
    async (rawText) => {
      const text = String(rawText ?? "").trim();
      if (!text || isSending) return;

      appendMessage({ role: "user", content: text });
      setIsSending(true);

      try {
        const { data } = await portalAssistantAPI.chat({ message: text });

        appendMessage({
          role: "assistant",
          content:
            data?.answer ||
            data?.message ||
            "I couldn't generate a response for that request.",
        });
      } catch (error) {
        if (error?.response?.status === 401) {
          toast.error("Your session has expired. Please sign in again.");
        }

        appendMessage({
          role: "assistant",
          error: true,
          content: errorMessageFor(error),
        });
      } finally {
        setIsSending(false);
      }
    },
    [appendMessage, isSending],
  );

  const handleSubmit = useCallback(() => {
    if (!input.trim() || isSending) return;
    const text = input;
    setInput("");
    sendMessage(text);
  }, [input, isSending, sendMessage]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const clearConversation = useCallback(() => {
    setMessages([]);
    setInput("");
    inputRef.current?.focus();
  }, []);

  // The assistant is only meaningful inside the authenticated portal, and only
  // for the roles the backend's /ai/chat route allows. The backend remains the
  // authority on what each role may see.
  if (authLoading || !isAuthenticated || !allowed) return null;

  const showEmptyState = messages.length === 0;

  return (
    <>
      {/* Floating launcher */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open MBS Portal Assistant"
          className="pa-launcher"
        >
          <MessageSquare size={24} strokeWidth={2} />
        </button>
      )}

      {/* Assistant panel */}
      {isOpen && (
        <section
          className="pa-panel"
          role="dialog"
          aria-modal="false"
          aria-label="MBS Portal Assistant"
        >
          {/* Header */}
          <header className="pa-header">
            <div className="pa-header-id">
              <span className="pa-header-avatar" aria-hidden="true">
                <Bot size={20} />
              </span>
              <div className="pa-header-text">
                <h2 className="pa-title">MBS Portal Assistant</h2>
                <p className="pa-subtitle">
                  <span className="pa-status-dot" aria-hidden="true" />
                  School Management Assistant
                </p>
              </div>
            </div>

            <div className="pa-header-actions">
              <button
                type="button"
                className="pa-icon-btn"
                onClick={clearConversation}
                aria-label="Clear conversation"
                title="Clear conversation"
              >
                <Trash2 size={17} />
              </button>
              <button
                type="button"
                className="pa-icon-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Close assistant"
                title="Close assistant"
              >
                <X size={19} />
              </button>
            </div>
          </header>

          {/* Messages */}
          <div className="pa-messages" aria-live="polite">
            {showEmptyState && (
              <div className="pa-empty">
                <span className="pa-empty-icon" aria-hidden="true">
                  <Sparkles size={22} />
                </span>
                <p className="pa-empty-title">{greeting}</p>
                <p className="pa-empty-hint">
                  I can look up school information you're allowed to see.
                </p>
              </div>
            )}

            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {isSending && (
              <div className="pa-row pa-row-assistant">
                <span className="pa-bubble-avatar" aria-hidden="true">
                  <Bot size={16} />
                </span>
                <div className="pa-bubble pa-bubble-loading">
                  <Loader2 size={15} className="pa-spin" />
                  <span>Checking the portal...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          <div className="pa-suggestions">
            <div className="pa-suggestions-scroll">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="pa-chip"
                  disabled={isSending}
                  onClick={() => sendMessage(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Composer */}
          <div className="pa-composer">
            <div className="pa-input-wrap">
              <label className="pa-sr-only" htmlFor="pa-input">
                Ask the MBS Portal Assistant
              </label>
              <textarea
                id="pa-input"
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                rows={1}
                className="pa-input"
                disabled={isSending}
              />
              <button
                type="button"
                className="pa-send"
                onClick={handleSubmit}
                disabled={!input.trim() || isSending}
                aria-label="Send message"
              >
                {isSending ? (
                  <Loader2 size={17} className="pa-spin" />
                ) : (
                  <Send size={17} />
                )}
              </button>
            </div>
            <p className="pa-composer-hint">
              Enter to send · Shift + Enter for a new line
            </p>
          </div>
        </section>
      )}
    </>
  );
}

/* =========================================================
   MESSAGE BUBBLE
========================================================= */

function MessageBubble({ message }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="pa-row pa-row-user">
        <div className="pa-bubble pa-bubble-user">{message.content}</div>
      </div>
    );
  }

  return (
    <div className="pa-row pa-row-assistant">
      <span className="pa-bubble-avatar" aria-hidden="true">
        <Bot size={16} />
      </span>
      <div
        className={`pa-bubble ${
          message.error ? "pa-bubble-error" : "pa-bubble-assistant"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}