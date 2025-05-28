import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminProfile.css';

function AdminProfile() {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken'); // if using JWT

      const res = await axios.post(
        'http://127.0.0.1:8000/api/admin/change-password/',
        { password },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      setMessage(res.data.message);
      setPassword('');
      setShowPasswordForm(false);
    } catch (error) {
      setMessage("Failed to update password.");
      console.error(error);
    }
  };

  return (
    <div className="admin-profile-page">
      <div className="admin-profile-card">
        <h2>Admin Profile</h2>
        <p><strong>Name:</strong> Admin User</p>

        <button onClick={() => setShowPasswordForm(!showPasswordForm)} className="btn btn-primary">
          {showPasswordForm ? "Cancel" : "Change Password"}
        </button>

        {showPasswordForm && (
          <form onSubmit={handleChangePassword} className="password-form">
            <input
              type="password"
              value={password}
              placeholder="Enter New Password"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-success">Update</button>
          </form>
        )}

        <button onClick={handleLogout} className="btn btn-danger logout-btn">Log Out</button>
        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
}

export default AdminProfile;
