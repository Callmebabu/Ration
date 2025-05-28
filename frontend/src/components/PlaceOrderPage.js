import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./PlaceOrderPage.css";
import axios from "axios";
import { useTranslation } from "react-i18next";

function PlaceOrderPage() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedItems = [], user } = location.state || {};

  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const total = selectedItems.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );

  const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:8000/api`;

  useEffect(() => {
    if (!selectedItems.length || !user) {
      navigate("/shop");
    }
  }, [selectedItems, user, navigate]);

  const handleProceedToPayment = async () => {
    if (!user?.email) {
      setMessage(t("errors.missing_email"));
      return;
    }
    if (total <= 0) {
      setMessage(t("errors.empty_cart"));
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const response = await axios.post(`${API_BASE_URL}/send_otp_email/`, {
        email: user.email,
      });

      if (response.data.success) {
        setOtpSent(true);
        setMessage(t("OTP sent successfully! Please check your email."));
      } else {
        setMessage(response.data.error || t("errors.send_otp_fail"));
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      setMessage(t("errors.send_otp_error"));
    } finally {
      setLoading(false);
    }
  };

  const generateAndDownloadPDF = useCallback(async () => {
    try {
      const lang = i18n.language || "en";

      const response = await axios.get(
        `${API_BASE_URL}/download_invoice/${user.email}`,
        {
          params: { lang },
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "invoice.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setMessage(t("Failed to download invoice PDF."));
    }
  }, [API_BASE_URL, user.email, t, i18n.language]);

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setOtpError(t("errors.otp_required"));
      return;
    }

    setLoading(true);
    setOtpError("");
    setMessage("");

    try {
      const payload = {
        email: user.email,
        otp: otp.trim(),
        family_id: user.family_id,
        items: selectedItems.map((item) => ({
          id: item.item_id,
          quantity: item.quantity,
        })),
      };

      const response = await axios.post(
        `${API_BASE_URL}/verify_otp_place_order/`,
        payload
      );

      if (response.data.success) {
        setPaymentSuccess(true);
        setMessage(t("Payment and order placed successfully! Redirecting..."));
        localStorage.removeItem("selectedItems");
        localStorage.removeItem("order");

        await generateAndDownloadPDF();

        setTimeout(() => {
          navigate("/shop");
        }, 3000);
      } else {
        setOtpError(response.data.error || t("errors.verify_fail"));
      }
    } catch (error) {
      console.error("Error during OTP verification and order placement:", error);
      setMessage(t("errors.general_error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="place-order-wrapper">
      <Navbar />
      <div className="place-order-container">
        <h2>{t("confirm_order")}</h2>
        {message && <div className="message">{message}</div>}

        <table className="order-table">
          <thead>
            <tr>
              <th>{t("table.image")}</th>
              <th>{t("table.name")}</th>
              <th>{t("table.quantity")}</th>
              <th>{t("table.price_per_kg")}</th>
              <th>{t("table.total_price")}</th>
            </tr>
          </thead>
          <tbody>
            {selectedItems.map((item, idx) => (
              <tr key={idx}>
                <td>
                  <img
                    src={
                      item.image?.startsWith("http")
                        ? item.image
                        : `${window.location.protocol}//${window.location.hostname}:8000/media/${item.image}`
                    }
                    alt={item.name || "Item Image"}
                    className="item-thumb"
                  />
                </td>
                <td>
                  <strong>{item.name ? t(item.name) : t("unnamedItem")}</strong>
                </td>
                <td>{item.quantity}</td>
                <td>₹{item.price}</td>
                <td>₹{item.quantity * item.price}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="order-total">
          <strong>{t("total", { total })}</strong>
        </div>

        {!otpSent && !paymentSuccess && (
          <button
            onClick={handleProceedToPayment}
            className="proceed-btn"
            disabled={loading || total <= 0}
          >
            {loading ? t("sending_otp") : t("proceed_to_payment")}
          </button>
        )}

        {otpSent && !paymentSuccess && (
          <div className="otp-form">
            <h3>{t("enter_otp")}</h3>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder={t("otp_placeholder")}
              maxLength={6}
            />
            {otpError && <div className="error-message">{otpError}</div>}
            <button
              onClick={handleVerifyOtp}
              className="verify-btn"
              disabled={loading}
            >
              {loading ? t("verifying_otp") : t("verify_otp")}
            </button>
          </div>
        )}

        {paymentSuccess && (
          <div className="payment-success-message">
            <h3>{t("payment_successful")}</h3>
          </div>
        )}
      </div>
    </div>
  );
}

export default PlaceOrderPage;
