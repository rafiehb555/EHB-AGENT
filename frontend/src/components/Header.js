import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMenu, FiX, FiSettings, FiUser, FiBell } from 'react-icons/fi';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', path: '/', icon: '🏠' },
    { name: 'Robot', path: '/robot', icon: '🤖' },
    { name: 'Advanced', path: '/advanced', icon: '🚀' },
    { name: 'Vault', path: '/vault', icon: '🔒' },
    { name: 'Developer', path: '/developer', icon: '💻' },
    { name: 'Collaboration', path: '/collaboration', icon: '🤝' },
    { name: 'Legal', path: '/legal', icon: '⚖️' },
    { name: 'Court', path: '/court', icon: '🏛️' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="header"
    >
      <div className="header-container">
        {/* Logo and Brand */}
        <motion.div
          className="brand"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link to="/" className="brand-link">
            <div className="brand-icon">🚀</div>
            <div className="brand-text">
              <h1 className="brand-title">EHB AI Robot</h1>
              <p className="brand-subtitle">SIVOS™ PRO MAX</p>
            </div>
          </Link>
        </motion.div>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          <ul className="nav-list">
            {navigation.map((item) => (
              <motion.li
                key={item.path}
                className="nav-item"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to={item.path}
                  className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-text">{item.name}</span>
                </Link>
              </motion.li>
            ))}
          </ul>
        </nav>

        {/* Header Actions */}
        <div className="header-actions">
          <motion.button
            className="action-button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Notifications"
          >
            <FiBell />
            <span className="notification-badge">3</span>
          </motion.button>

          <motion.button
            className="action-button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Settings"
          >
            <FiSettings />
          </motion.button>

          <motion.button
            className="action-button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Profile"
          >
            <FiUser />
          </motion.button>

          {/* Mobile Menu Button */}
          <motion.button
            className="mobile-menu-button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <FiX /> : <FiMenu />}
          </motion.button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <motion.nav
        className={`mobile-nav ${isMenuOpen ? 'open' : ''}`}
        initial={{ opacity: 0, height: 0 }}
        animate={{
          opacity: isMenuOpen ? 1 : 0,
          height: isMenuOpen ? 'auto' : 0,
        }}
        transition={{ duration: 0.3 }}
      >
        <ul className="mobile-nav-list">
          {navigation.map((item) => (
            <motion.li
              key={item.path}
              className="mobile-nav-item"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to={item.path}
                className={`mobile-nav-link ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="mobile-nav-icon">{item.icon}</span>
                <span className="mobile-nav-text">{item.name}</span>
              </Link>
            </motion.li>
          ))}
        </ul>
      </motion.nav>
    </motion.header>
  );
};

export default Header;
