import React from 'react';
import AdminSidebar from './AdminSidebar';
import './AdminDashboard.css';

function AdminDashboard() {
  return (
    <div className="admin-dashboard">
      <AdminSidebar />
      <div className="dashboard-content">
        <h1>Welcome to the Admin Dashboard</h1>
        <p>Use the sidebar to navigate.</p>
      </div>
    </div>
  );
}

export default AdminDashboard;
