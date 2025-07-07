"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "bot",
      content: "Hi — I'm the Zizi Afrique chatbot. How may I assist you?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState({});
  const messagesEndRef = useRef(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: input }),
      });

      const data = await res.json();

      const botMessage = {
        role: "bot",
        content: data.response.answer || "❗ No useful sentences found.",
        source: data.response.source || "Unknown source",
        query: input,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: "❌ Failed to fetch response from the server.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sendFeedback = async (index, type) => {
    const msg = messages[index];
    if (!msg || msg.role !== "bot" || feedbackGiven[index]) return;

    try {
      await fetch("http://127.0.0.1:8000/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: msg.query || "",
          answer: msg.content || "",
          source: msg.source || "",
          feedback: type,
        }),
      });
      setFeedbackGiven((prev) => ({ ...prev, [index]: true }));
    } catch (err) {
      console.error("Error sending feedback:", err);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black font-[Calibri] p-4">
      <div className="w-full max-w-lg p-6 bg-white rounded-2xl border-4 border-black shadow-xl">
        {/* Logo */}
        <div className="flex items-center justify-center mb-4">
          <Image
            src="/zizi-logo.png"
            alt="Zizi Afrique Logo"
            width={90}
            height={90}
          />
        </div>

        {/* Messages */}
        <div className="h-80 overflow-y-auto mb-4 space-y-3 px-2">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`max-w-[80%] px-4 py-2 rounded-lg text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-[#6FAD46] text-white ml-auto text-right"
                  : "bg-[#7A2982] text-white mr-auto text-left"
              }`}
            >
              {msg.content}
              {msg.role === "bot" && msg.source && (
                <div className="mt-2 text-xs italic text-gray-300">
                  Source: {msg.source}
                </div>
              )}
              {msg.role === "bot" && i !== 0 && !feedbackGiven[i] && (
                <div className="mt-2 flex gap-2 text-sm text-black">
                  Was this helpful?
                  <button
                    onClick={() => sendFeedback(i, "thumbs_up")}
                    className="hover:text-green-600"
                  >
                    👍
                  </button>
                  <button
                    onClick={() => sendFeedback(i, "thumbs_down")}
                    className="hover:text-red-600"
                  >
                    👎
                  </button>
                </div>
              )}
              {msg.role === "bot" && i !== 0 && feedbackGiven[i] && (
                <div className="mt-1 text-green-300 text-xs">
                  ✅ Feedback recorded
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="text-[#7A2982] text-sm italic animate-pulse">
              Zizi is typing...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={submit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-gray-100 border border-gray-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7A2982] text-black placeholder-gray-600"
          />
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 rounded-lg transition text-white ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#6FAD46] hover:bg-green-800"
            }`}
          >
            {loading ? (
              <span className="animate-pulse">Sending...</span>
            ) : (
              "Send"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

