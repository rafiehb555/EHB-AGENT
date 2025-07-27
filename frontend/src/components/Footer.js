import React from 'react';
import { motion } from 'framer-motion';

const Footer = () => {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="footer"
    >
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="footer-logo">🚀</div>
            <div className="footer-text">
              <h3>EHB AI Robot</h3>
              <p>SIVOS™ PRO MAX</p>
            </div>
          </div>

          <div className="footer-links">
            <div className="footer-section">
              <h4>Features</h4>
              <ul>
                <li>Telepathy Mode</li>
                <li>Voice Vault</li>
                <li>Cross-Service</li>
                <li>Developer Mode</li>
              </ul>
            </div>

            <div className="footer-section">
              <h4>Support</h4>
              <ul>
                <li>Documentation</li>
                <li>API Reference</li>
                <li>Community</li>
                <li>Contact</li>
              </ul>
            </div>

            <div className="footer-section">
              <h4>Legal</h4>
              <ul>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Cookie Policy</li>
                <li>GDPR</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2024 EHB AI Robot. All rights reserved.</p>
          <p>Advanced AI Technology for a Better Tomorrow</p>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
