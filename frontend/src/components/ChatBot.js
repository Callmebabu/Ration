import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

function ChatBot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const chatBodyRef = useRef(null);

  // Auto scroll to bottom whenever messages change
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    try {
      const res = await axios.post("http://localhost:8000/api/chatbot/", {
        message: input,
      });

      const botMsg = { sender: "bot", text: res.data.reply };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Sorry, server error." },
      ]);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: "20px auto", fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif' }}>
      <h2>Ration Shop Chatbot</h2>
      <div
        ref={chatBodyRef}
        style={{
          border: "1px solid #ccc",
          padding: 10,
          height: 300,
          overflowY: "auto",
          marginBottom: 10,
          borderRadius: 8,
          backgroundColor: "#f9f9f9"
        }}
      >
        {messages.length === 0 && (
          <p style={{ fontStyle: "italic", color: "#888" }}>Ask me anything!</p>
        )}
        {messages.map((msg, idx) => (
          <p
            key={idx}
            style={{
              textAlign: msg.sender === "user" ? "right" : "left",
              backgroundColor: msg.sender === "user" ? "#d1e7dd" : "#f8d7da",
              padding: "8px 12px",
              borderRadius: 15,
              maxWidth: "80%",
              margin: "5px 0",
              alignSelf: msg.sender === "user" ? "flex-end" : "flex-start"
            }}
          >
            <b>{msg.sender === "user" ? "You" : "Bot"}:</b> {msg.text}
          </p>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        placeholder="Ask something..."
        style={{
          width: "80%",
          padding: 10,
          borderRadius: 20,
          border: "1px solid #ccc",
          outline: "none",
          fontSize: 16,
        }}
        aria-label="Chat input"
        autoFocus
      />
      <button
        onClick={sendMessage}
        style={{
          padding: "10px 20px",
          marginLeft: 10,
          borderRadius: 20,
          border: "none",
          backgroundColor: "#007bff",
          color: "white",
          cursor: "pointer",
          fontSize: 16,
        }}
        aria-label="Send message"
      >
        Send
      </button>
    </div>
  );
}

export default ChatBot;
