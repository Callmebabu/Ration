import React, { useState, useEffect, useRef } from "react";
import "./HomePage.css";
import Navbar from "./Navbar";
import { Pie, Bar, Line } from "react-chartjs-2";
import axios from "axios";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "chart.js/auto";
import { useTranslation } from "react-i18next";
import cryImage from "../assets/images/cry.png";
import scrollGif from "../assets/images/up3.gif";
import chatGif from "../assets/images/chat.gif";
function HomePage() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedChart, setSelectedChart] = useState("pie");

  const [userName, setUserName] = useState("");
  const [greeting, setGreeting] = useState("");

  // Chatbot states
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  // Ref for chat body container to scroll
  const chatBodyRef = useRef(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const baseURL = `${window.location.protocol}//${window.location.hostname}:8000`;

    if (storedUser?.family_id) {
      setUserName(storedUser.name || storedUser.username || "");

      axios
        .get(`${baseURL}/api/stock/`, {
          params: { family_id: storedUser.family_id },
        })
        .then((res) => {
          if (res.data.stock && res.data.stock.length > 0) {
            setItems(res.data.stock);
          } else {
            setItems([]);
          }
        })
        .catch((err) => {
          console.error("API error:", err);
          setError("error_fetch");
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setError("error_user");
      setLoading(false);
    }

    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting(t("good_morning"));
    } else if (hour < 18) {
      setGreeting(t("good_afternoon"));
    } else {
      setGreeting(t("good_evening"));
    }

    window.scrollTo({ top: 0, behavior: "instant" });
  }, [t]);

  // Scroll chat to bottom on messages update
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  const generateColors = (count) =>
    Array.from({ length: count }, (_, i) => `hsl(${(i * 360) / count}, 70%, 60%)`);

  const labels = items.map((item) => t(item.name || item.item_name));
  const quantities = items.map((item) => Number(item.total_quantity || 0));
  const colors = generateColors(items.length);

  const pieData = {
    labels,
    datasets: [
      {
        label: t("stockKg"),
        data: quantities,
        backgroundColor: colors,
        borderColor: "#fff",
        borderWidth: 2,
      },
    ],
  };

  const barData = {
    labels,
    datasets: [
      {
        label: t("stockKg"),
        data: quantities,
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
    ],
  };

  const lineData = {
    labels,
    datasets: [
      {
        label: t("stockKg"),
        data: quantities,
        fill: true,
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        tension: 0.4,
      },
    ],
  };

  // Chatbot send message function
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);

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

    setInput("");
  };

  return (
    <div className="home-background-wrapper">
      <Navbar />
      <ToastContainer />
      <div className="home-container">
        <h2 className="home-title">
          {greeting}, {userName ? userName : t("guest")}!
        </h2>
        <p className="home-subtitle">{t("online_ration_shop_subtitle")}</p>

        {loading && <p>{t("loading")}</p>}
        {error && <p className="error-message">{t(error)}</p>}

        {!loading && !error && (
          <>
            {items.length === 0 ? (
              <div className="no-stock-container">
                <img src={cryImage} alt="No stock" className="no-stock-image" />
                <p className="no-stock-text">{t("no_stock_available")}</p>
              </div>
            ) : (
              <>
                <div className="chart-buttons">
                  <button
                    onClick={() => setSelectedChart("pie")}
                    className={`chart-btn ${selectedChart === "pie" ? "active" : ""}`}
                  >
                    {t("pie_chart")}
                  </button>
                  <button
                    onClick={() => setSelectedChart("bar")}
                    className={`chart-btn ${selectedChart === "bar" ? "active" : ""}`}
                  >
                    {t("bar_chart")}
                  </button>
                  <button
                    onClick={() => setSelectedChart("line")}
                    className={`chart-btn ${selectedChart === "line" ? "active" : ""}`}
                  >
                    {t("line_chart")}
                  </button>
                </div>

                <div className="chart-box">
                  {selectedChart === "pie" && (
                    <div className="chart-container">
                      <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                  )}
                  {selectedChart === "bar" && (
                    <div className="chart-container">
                      <Bar data={barData} />
                    </div>
                  )}
                  {selectedChart === "line" && (
                    <div className="chart-container">
                      <Line data={lineData} />
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="about-section">
              <h3>{t("about_title")}</h3>
              <p>{t("about_1")}</p>
              <p>{t("about_2")}</p>
            </div>
          </>
        )}
      </div>

      {/* Scroll-to-Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="scroll-to-top-btn"
        aria-label="Scroll to top"
      >
        <img src={scrollGif} alt="Scroll to top" />
      </button>

      {/* Chat Icon */}
      <div
        className="chat-icon-wrapper"
        onClick={() => setChatOpen((open) => !open)}
        aria-label="Toggle Chatbot"
      >
<img
  className="chat-icon"
  src={chatGif}
  alt="Chat GIF Icon"
  draggable={false}
/>

      </div>

      {/* Chat Box */}
      {chatOpen && (
        <div className="chat-box" role="dialog" aria-modal="true" aria-label="Chatbot Window">
          <div className="chat-header">
            <span>Ration Shop Chatbot</span>
            <button
              className="chat-close-btn"
              onClick={() => setChatOpen(false)}
              aria-label="Close Chatbot"
            >
              &times;
            </button>
          </div>
          <div
            className="chat-body"
            id="chat-body"
            tabIndex={0}
            ref={chatBodyRef}  // <-- Attach ref here to enable scrolling
          >
            {messages.length === 0 && <p style={{ fontStyle: "italic" }}>Ask me anything!</p>}
            {messages.map((msg, idx) => (
              <p
                key={idx}
                style={{ textAlign: msg.sender === "user" ? "right" : "left" }}
                className={msg.sender === "user" ? "user-msg" : "bot-msg"}
              >
                <b>{msg.sender === "user" ? "You" : "Bot"}:</b> {msg.text}
              </p>
            ))}
          </div>
          <div className="chat-input-area">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask something..."
              aria-label="Chat input"
              autoFocus
            />
            <button onClick={sendMessage} aria-label="Send message">Send</button>
          </div>
        </div>
      )}
    </div>
  );
}

if (/Android/i.test(navigator.userAgent)) {
  document.body.classList.add("android-device");
}

export default HomePage;
