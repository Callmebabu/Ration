import React, { useState, useEffect } from 'react';
import './Navbar.css';
import { Link } from 'react-router-dom';
import wheatIcon from '../assets/images/lo.png';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { FaGlobe } from 'react-icons/fa';

function Navbar({ hidden }) {
  const { t } = useTranslation();
  const [isActive, setIsActive] = useState(false);
  const [notificationCount] = useState(3);
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [animateText, setAnimateText] = useState(false);

  const toggleMenu = () => setIsActive(!isActive);

  const handleLinkClick = () => {
    const audio = new Audio('/sounds/so1.mp3');
    audio.play();
    setIsActive(false);
  };

  const changeLanguage = (lng) => {
    setAnimateText(true);
    i18n.changeLanguage(lng);
    setTimeout(() => setAnimateText(false), 500);
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY) {
        setShowNavbar(false);
      } else {
        setShowNavbar(true);
      }
      setLastScrollY(currentScrollY);
    };

    const handleMouseMove = (e) => {
      if (e.clientY < 50) {
        setShowNavbar(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [lastScrollY]);

  if (hidden) return null;

  return (
    <nav className={`navbar ${isActive ? 'active' : ''} ${showNavbar ? 'show' : 'hide'}`}>
      <Link to="/home" className="nav-logo" onClick={handleLinkClick}>
        <img src={wheatIcon} alt="Logo" className="logo-icon" />
        <span className={animateText ? 'animate-text' : ''}>{t('rationStore')}</span>
      </Link>

      <div className="nav-toggle" onClick={toggleMenu}>
        <span></span><span></span><span></span>
      </div>

      <ul className={`nav-links ${isActive ? 'nav-active' : ''}`}>
        <li><Link to="/user" className="nav-link" onClick={handleLinkClick}><i className="fas fa-user nav-icon" /><span className={animateText ? 'animate-text' : ''}>{t('userDashboard')}</span></Link></li>
        <li><Link to="/home" className="nav-link" onClick={handleLinkClick}><i className="fas fa-home nav-icon" /><span className={animateText ? 'animate-text' : ''}>{t('home')}</span></Link></li>
        <li><Link to="/item" className="nav-link" onClick={handleLinkClick}><i className="fas fa-store nav-icon" /><span className={animateText ? 'animate-text' : ''}>{t('shopItems')}</span></Link></li>
        <li className="nav-link-with-badge">
          <Link to="/notifications" className="nav-link" onClick={handleLinkClick}>
            <i className="fas fa-bell nav-icon" />
            <span className={animateText ? 'animate-text' : ''}>{t('notifications')}</span>
            {notificationCount > 0 && (
              <span className="notification-badge">{notificationCount}</span>
            )}
          </Link>
        </li>
        <li>
          <div className="language-selector">
            <FaGlobe className="lang-icon" />
            <select
              className="language-select"
              onChange={(e) => changeLanguage(e.target.value)}
              value={i18n.language}
            >
              <option value="ta">தமிழ்</option>
              <option value="en">English</option>
            </select>
          </div>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;
