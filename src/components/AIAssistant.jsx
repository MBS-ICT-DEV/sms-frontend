import { useEffect, useRef, useState } from "react";
import {
  Bot,
  X,
  Send,
  Sparkles,
  Loader2,
  Minimize2,
  Trash2,
  MessageCircle,
  ArrowUpRight,
} from "lucide-react";

import apiClient from "../api/axios";
import { useAuth } from "../context/AuthContext";

const AIAssistant = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content:
        "Hello 👋 I'm your MBS School Portal Assistant. I can help you navigate the portal and answer questions using your available school information.",
    },
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [isOpen, isMinimized]);

  const sendMessage = async (customMessage = null) => {
    const trimmedMessage = (
      customMessage ?? message
    ).trim();

    if (!trimmedMessage || loading) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: trimmedMessage,
    };

    setMessages((prev) => [...prev, userMessage]);

    setMessage("");

    setLoading(true);

    try {
      const response = await apiClient.post(
        "/ai/chat",
        {
          message: trimmedMessage,
        }
      );

      const answer = response?.data?.answer;

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content:
            answer ||
            "I couldn't generate a response for that request.",
        },
      ]);
    } catch (error) {
      console.error(
        "AI ASSISTANT ERROR:",
        error
      );

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          error: true,
          content:
            error?.response?.data?.message ||
            "I couldn't connect to the School Portal Assistant. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: Date.now(),
        role: "assistant",
        content:
          "Conversation cleared. How can I help you?",
      },
    ]);
  };

  const suggestions = [
    {
      label: "Attendance",
      text: "How do I mark attendance?",
    },
    {
      label: "My information",
      text: "What information can you see about me?",
    },
    {
      label: "Portal help",
      text: "What can I do on this portal?",
    },
  ];

  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* FLOATING BUTTON */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          aria-label="Open School Portal Assistant"
          className="
            fixed
            right-4
            bottom-4
            sm:right-6
            sm:bottom-6
            z-[999999]

            w-14
            h-14
            sm:w-15
            sm:h-15

            rounded-2xl

            bg-blue-600
            hover:bg-blue-700

            text-white

            shadow-[0_12px_35px_rgba(37,99,235,0.28)]
           rounded-full
            flex
            items-center
            justify-center

            border
            border-blue-500

            transition-all
            duration-200

            hover:-translate-y-1
            active:scale-95

            focus:outline-none
            focus:ring-4
            focus:ring-blue-100
          "
        >
           <Bot
                    size={31}
                    strokeWidth={2}
                  />
        </button>
      )}

      {/* ASSISTANT WINDOW */}
      {isOpen && (
        <div
          className="
            fixed
            z-[999999]

            right-0
            bottom-0

            sm:right-5
            sm:bottom-5

            w-full
            sm:w-[410px]

            max-w-full
            sm:max-w-[calc(100vw-40px)]

            h-[100dvh]
            sm:h-auto
            sm:max-h-[680px]

            bg-white

            sm:rounded-2xl

            overflow-hidden

            border
            border-gray-200

            shadow-[0_20px_70px_rgba(15,23,42,0.18)]

            flex
            flex-col
          "
        >
          {/* HEADER */}
          <div
            className="
              sticky
              top-0
              z-20
              shrink-0
              bg-blue-600
              text-white
              px-4
              py-3.5
              border-b
              border-blue-500/40
            "
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="
                    w-10
                    h-10
                    shrink-0
                    rounded-xl
                    bg-white/15
                    border
                    border-white/10
                    flex
                    items-center
                    justify-center
                  "
                >
                  <Bot
                    size={21}
                    strokeWidth={2}
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm truncate">
                      MBS Portal Assistance
                    </h3>

                   
                  </div>

                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />

                    <span className="text-[11px] text-blue-100">
                      School Management Assistant
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setIsMinimized(
                      (prev) => !prev
                    )
                  }
                  aria-label="Minimize assistant"
                  className="
                    w-9
                    h-9
                    rounded-lg
                    flex
                    items-center
                    justify-center
                    hover:bg-white/10
                    transition
                  "
                >
                  <Minimize2 size={17} />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setIsOpen(false)
                  }
                  aria-label="Close assistant"
                  className="
                    w-9
                    h-9
                    rounded-lg
                    flex
                    items-center
                    justify-center
                    hover:bg-white/10
                    transition
                  "
                >
                  <X size={19} />
                </button>
              </div>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* MESSAGE AREA */}
              <div
                className="
                  flex-1
                  min-h-0
                  overflow-y-auto
                  overscroll-contain
                  bg-slate-50
                  px-3
                  sm:px-4
                  py-4
                  scrollbar-thin
                "
              >
                <div className="space-y-4">
                  {messages.map((item) => {
                    const isUser =
                      item.role === "user";

                    return (
                      <div
                        key={item.id}
                        className={`flex items-end gap-2 ${
                          isUser
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        {!isUser && (
                          <div
                            className="
                              w-8
                              h-8
                              shrink-0
                              rounded-xl
                              bg-blue-100
                              text-blue-600
                              flex
                              items-center
                              justify-center
                            "
                          >
                            <Bot size={16} />
                          </div>
                        )}

                        <div
                          className={`
                            max-w-[82%]

                            px-3.5
                            py-2.5

                            rounded-2xl

                            text-[13px]
                            leading-6

                            whitespace-pre-wrap
                            break-words

                            ${
                              isUser
                                ? `
                                  bg-blue-600
                                  text-white
                                  rounded-br-md
                                `
                                : item.error
                                ? `
                                  bg-red-50
                                  text-red-700
                                  border
                                  border-red-100
                                  rounded-bl-md
                                `
                                : `
                                  bg-white
                                  text-slate-700
                                  border
                                  border-slate-200
                                  rounded-bl-md
                                `
                            }
                          `}
                        >
                          {item.content}
                        </div>
                      </div>
                    );
                  })}

                  {/* THINKING */}
                  {loading && (
                    <div className="flex items-end gap-2">
                      <div
                        className="
                          w-8
                          h-8
                          shrink-0
                          rounded-xl
                          bg-blue-100
                          text-blue-600
                          flex
                          items-center
                          justify-center
                        "
                      >
                        <Bot size={16} />
                      </div>

                      <div
                        className="
                          bg-white
                          border
                          border-slate-200
                          rounded-2xl
                          rounded-bl-md
                          px-4
                          py-3
                        "
                      >
                        <div className="flex items-center gap-2">
                          <Loader2
                            size={15}
                            className="
                              animate-spin
                              text-blue-600
                            "
                          />

                          <span className="text-xs text-slate-500">
                            Checking the portal...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* SUGGESTIONS */}
              <div
                className="
                  shrink-0
                  bg-white
                  px-3
                  sm:px-4
                  pt-3
                "
              >
                <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none">
                  {suggestions.map(
                    (suggestion) => (
                      <button
                        key={suggestion.label}
                        type="button"
                        disabled={loading}
                        onClick={() =>
                          sendMessage(
                            suggestion.text
                          )
                        }
                        className="
                          shrink-0

                          flex
                          items-center
                          gap-1.5

                          px-3
                          py-2

                          rounded-xl

                          bg-slate-50
                          hover:bg-blue-50

                          border
                          border-slate-200
                          hover:border-blue-200

                          text-[11px]
                          font-medium

                          text-slate-600
                          hover:text-blue-600

                          transition

                          disabled:opacity-50
                        "
                      >
                        {suggestion.label}

                        <ArrowUpRight
                          size={12}
                        />
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* INPUT */}
              <div
                className="
                  shrink-0
                  bg-white

                  border-t
                  border-slate-100

                  px-3
                  sm:px-4
                  pt-3
                  pb-[max(12px,env(safe-area-inset-bottom))]
                "
              >
                <div
                  className="
                    flex
                    items-end
                    gap-2

                    p-1.5

                    rounded-2xl

                    border
                    border-slate-200

                    bg-slate-50

                    focus-within:border-blue-400
                    focus-within:ring-4
                    focus-within:ring-blue-50

                    transition
                  "
                >
                  <textarea
                    ref={inputRef}
                    value={message}
                    onChange={(event) =>
                      setMessage(
                        event.target.value
                      )
                    }
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about the school portal..."
                    rows={1}
                    disabled={loading}
                    className="
                      flex-1

                      min-h-[42px]
                      max-h-[110px]

                      resize-none

                      bg-transparent

                      border-0
                      outline-none

                      px-2.5
                      py-2.5

                      text-sm
                      text-slate-700

                      placeholder:text-slate-400

                      disabled:opacity-50
                    "
                  />

                  <button
                    type="button"
                    onClick={() =>
                      sendMessage()
                    }
                    disabled={
                      !message.trim() ||
                      loading
                    }
                    aria-label="Send message"
                    className="
                      w-10
                      h-10
                      shrink-0

                      rounded-xl

                      bg-blue-600
                      hover:bg-blue-700

                      text-white

                      flex
                      items-center
                      justify-center

                      transition

                      disabled:bg-slate-200
                      disabled:text-slate-400

                      focus:outline-none
                      focus:ring-2
                      focus:ring-blue-200
                    "
                  >
                    {loading ? (
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                    ) : (
                      <Send size={17} />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between mt-2 px-1">
                  <span className="text-[10px] text-slate-400">
                    AI uses authorized portal information.
                  </span>

                  <button
                    type="button"
                    onClick={clearChat}
                    className="
                      flex
                      items-center
                      gap-1

                      text-[10px]

                      text-slate-400
                      hover:text-blue-600

                      transition
                    "
                  >
                    <Trash2 size={11} />
                    Clear
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default AIAssistant;
