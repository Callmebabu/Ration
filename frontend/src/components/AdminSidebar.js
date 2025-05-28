import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './AdminSidebar.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

function AdminSidebar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <div
        className={`hamburger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <i className="fas fa-bars"></i>
      </div>
      <nav className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
        <h2 className="sidebar-title">𝐀𝐝𝐦𝐢𝐧</h2>
        <ul className="sidebar-menu">
          <li>
            <Link to="/admin/add-aadhar" className={isActive('/admin/add-aadhar') ? 'active' : ''} onClick={() => setIsOpen(false)}>
              <i className="fas fa-id-card"></i>
              <span className="link-text">   𝙰𝚍𝚍 𝙰𝚊𝚍𝚑𝚊𝚛</span>
            </Link>
          </li>
          <li>
            <Link to="/admin/current-stock" className={isActive('/admin/current-stock') ? 'active' : ''} onClick={() => setIsOpen(false)}>
              <i className="fas fa-boxes"></i>
              <span className="link-text">  𝙲𝚞𝚛𝚛𝚎𝚗𝚝 𝚂𝚝𝚘𝚌𝚔</span>
            </Link>
          </li>
          <li>
            <Link to="/admin/add-stock" className={isActive('/admin/add-stock') ? 'active' : ''} onClick={() => setIsOpen(false)}>
              <i className="fas fa-plus-square"></i>
              <span className="link-text">  𝙰𝚍𝚍 𝚂𝚝𝚘𝚌𝚔</span>
            </Link>
          </li>
          <li>
            <Link to="/admin/view-orders" className={isActive('/admin/view-orders') ? 'active' : ''} onClick={() => setIsOpen(false)}>
              <i className="fas fa-receipt"></i>
              <span className="link-text">  𝚅𝚒𝚎𝚠 𝙾𝚛𝚍𝚎𝚛𝚜</span>
            </Link>
          </li>
          <li>
            <Link to="/admin/admin-profile" className={isActive('/admin/admin-profile') ? 'active' : ''} onClick={() => setIsOpen(false)}>
              <i className="fas fa-user-cog"></i>
              <span className="link-text">  𝙿𝚛𝚘𝚏𝚒𝚕𝚎</span>
            </Link>
          </li>
        </ul>
        <div className="sidebar-footer">
          &copy; {new Date().getFullYear()} Admin Panel
        </div>
      </nav>
    </>
  );
}

export default AdminSidebar;
