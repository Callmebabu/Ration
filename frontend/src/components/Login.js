import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './login.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

function Login() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [aadharNumber, setAadharNumber] = useState('');
  const [emailPrefix, setEmailPrefix] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 🌐 Dynamically choose API endpoint
const hostname = window.location.hostname;
const API_BASE = hostname.includes('192.168')
  ? 'http://192.168.29.125:8000/api'          // Local network dev
  : hostname === 'localhost' || hostname === '127.0.0.1'
  ? 'http://localhost:8000/api'                // Local dev on your machine
  : 'https://ration-a9md.onrender.com/api';    // Production


  const fullEmail = `${emailPrefix}@gmail.com`;

  // ⏱ OTP countdown
  useEffect(() => {
    let interval;
    if (isOtpSent && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (timer === 0 && isOtpSent) {
      setMessage('OTP has expired. Please request a new one.');
      setIsOtpSent(false);
    }
    return () => clearInterval(interval);
  }, [isOtpSent, timer]);

  // 🟦 Aadhar input formatting
  const handleAadharChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) setAadharNumber(value);
    else if (value.length <= 8) setAadharNumber(value.replace(/(\d{4})(\d{0,4})/, '$1-$2'));
    else setAadharNumber(value.replace(/(\d{4})(\d{4})(\d{0,4})/, '$1-$2-$3'));
  };

  // 🚪 Login / OTP Send
const handleLogin = async () => {
  setMessage('');
  setLoading(true);

  // For user login (not admin)
  if (!isAdmin) {
    try {
      const res = await axios.post('https://ration-a9md.onrender.com/api/validate-aadhar-email/', {
        aadhar_number: aadharNumber.replace(/-/g, ''),
        email: fullEmail,
      });
      console.log(res.data);
      if (!res.data.success) {
        setMessage('Aadhar number and email do not match.');
      } else {
        // Proceed with sending OTP or next step
      }
    } catch (error) {
      console.error(error);
      setMessage('Error validating Aadhar and email.');
    } finally {
      setLoading(false);
    }
  }
  // ... Admin login logic below
};


  // 🔐 OTP Verification
  const handleOtpVerification = async () => {
    if (!otp) {
      setMessage('Please enter the OTP.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/verify-otp/`, {
        aadhar_number: aadharNumber.replace(/-/g, ''),
        otp,
      });

      if (res.data.message === 'OTP verified successfully.') {
        localStorage.setItem('user', JSON.stringify(res.data));
        navigate('/shop');
      } else {
        setMessage(res.data.error || 'Invalid OTP.');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setMessage(error.response?.data?.error || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-toggle">
          <button className={`toggle-btn ${!isAdmin ? 'active' : ''}`} onClick={() => setIsAdmin(false)}>
            User Login
          </button>
          <button className={`toggle-btn ${isAdmin ? 'active' : ''}`} onClick={() => setIsAdmin(true)}>
            Admin Login
          </button>
        </div>

        {/* User Login */}
        {!isAdmin && (
          <div className="login-form fade-in">
            <h2 className="login-header">Aadhar Login</h2>
            <div className="input-container">
              <i className="fas fa-id-card"></i>
              <input
                type="text"
                placeholder="Enter Aadhar Number"
                value={aadharNumber}
                onChange={handleAadharChange}
                maxLength={14}
                className="login-input"
              />
            </div>
            <div className="input-container">
              <i className="fas fa-envelope"></i>
              <input
                type="text"
                placeholder="yourname"
                value={emailPrefix}
                onChange={(e) => setEmailPrefix(e.target.value)}
                className="login-input"
              />
              <span className="email-suffix">@gmail.com</span>
            </div>

            {!isOtpSent ? (
              <button onClick={handleLogin} className="login-button" disabled={loading}>
                {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Send OTP'}
              </button>
            ) : (
              <>
                <div className="input-container">
                  <i className="fas fa-key"></i>
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    className="login-input"
                  />
                </div>
                <button onClick={handleOtpVerification} className="login-button" disabled={loading}>
                  {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Verify OTP'}
                </button>
                <p className="otp-timer">
                  OTP expires in: {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
                </p>
              </>
            )}
          </div>
        )}

        {/* Admin Login */}
        {isAdmin && (
          <div className="login-form fade-in">
            <h2 className="login-header">Admin Login</h2>
            <div className="input-container">
              <i className="fas fa-user"></i>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="login-input"
              />
            </div>
            <div className="input-container">
              <i className="fas fa-lock"></i>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input"
              />
            </div>
            <button onClick={handleLogin} className="login-button" disabled={loading}>
              {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Login'}
            </button>
          </div>
        )}

        {message && <p className="login-message">{message}</p>}
      </div>
    </div>
  );
}

export default Login;
