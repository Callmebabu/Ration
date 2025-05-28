import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import "./NotificationPage.css";
import backgroundImage from "../assets/images/gg.jpg"; // Ensure this path is correct

function timeAgoTranslated(timestamp, t) {
  const now = new Date();
  const diffMs = now - new Date(timestamp);
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return t("secondsAgo", { count: diffSec });
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return t("minutesAgo", { count: diffMin });
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return t("hoursAgo", { count: diffHr });
  const diffDays = Math.floor(diffHr / 24);
  return t("daysAgo", { count: diffDays });
}

function UserNotificationPage({ userArea }) {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!userArea) return;
    setLoading(true);
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/api/notifications/${userArea}/`
      );
      setNotifications(response.data);
      await axios.post(
        `http://127.0.0.1:8000/api/notifications/mark_read/${userArea}/`
      );
    } catch (error) {
      console.error("Error fetching notifications", error);
    } finally {
      setLoading(false);
    }
  }, [userArea]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const dismissNotification = async (id) => {
    if (!window.confirm(t("dismissNotificationConfirm"))) return;
    try {
      await axios.post(
        `http://127.0.0.1:8000/api/notifications/${id}/dismiss/?area=${userArea}`
      );
      setNotifications((prev) => prev.filter((note) => note.id !== id));
    } catch (error) {
      console.error("Failed to dismiss notification:", error);
      alert(t("dismissNotificationFailed"));
    }
  };

  const deleteAllNotifications = async () => {
    if (!window.confirm(t("dismissAllConfirm"))) return;
    try {
      await axios.delete(
        `http://127.0.0.1:8000/api/notifications/delete_all/${userArea}/`
      );
      setNotifications([]);
    } catch (error) {
      console.error("Failed to dismiss all notifications:", error);
      alert(t("dismissAllFailed"));
    }
  };

  return (
    <div
      className="notification-background"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="notification-container">
        <h2>
          <img
            src={require("../assets/images/bell1.gif")} // adjust path if needed
            alt={t("bellIconAlt")}
            className="notification-icon"
          />{" "}
          {t("notifications")}
        </h2>

        <div className="notification-controls">
          <button
            className="refresh-btn"
            onClick={fetchNotifications}
            disabled={loading}
            aria-label={t("refresh")}
          >
            {loading ? t("loading") : t("refresh")}
          </button>
          <button
            className="delete-all-btn"
            onClick={deleteAllNotifications}
            disabled={notifications.length === 0}
            aria-label={t("dismissAll")}
          >
            {t("dismissAll")}
          </button>
        </div>

        {loading && notifications.length === 0 && (
          <p className="loading-text">{t("loadingNotifications")}</p>
        )}

        {!loading && notifications.length === 0 && <p>{t("noNotifications")}</p>}

        <ul className="notification-list">
          {notifications.map((note) => (
            <li key={note.id} className="notification-item">
              <div className="notification-header">
                <strong>{timeAgoTranslated(note.timestamp, t)}</strong>
                <button
                  className="dismiss-btn"
                  onClick={() => dismissNotification(note.id)}
                  aria-label={t("dismiss")}
                >
                  ✖
                </button>
              </div>
              <p>{note.message}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default UserNotificationPage;
