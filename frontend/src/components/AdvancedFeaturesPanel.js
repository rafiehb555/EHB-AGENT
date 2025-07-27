import React from 'react';
import { motion } from 'framer-motion';
import { FiZap, FiBrain, FiLink, FiShield, FiCode, FiUsers } from 'react-icons/fi';

const AdvancedFeaturesPanel = ({ onFeatureSelect, currentMode }) => {
  const features = [
    {
      id: 'telepathy',
      icon: <FiBrain />,
      title: 'Telepathy Mode',
      description: 'Understand unspoken intent through voice patterns',
      color: 'var(--primary-gradient)',
      active: currentMode === 'telepathy'
    },
    {
      id: 'cross-service',
      icon: <FiLink />,
      title: 'Cross-Service Commands',
      description: 'Execute multiple services with one voice command',
      color: 'var(--secondary-gradient)',
      active: currentMode === 'cross-service'
    },
    {
      id: 'voice-vault',
      icon: <FiShield />,
      title: 'Voice Vault',
      description: 'Secure voice-locked data storage',
      color: 'var(--success-gradient)',
      active: false
    },
    {
      id: 'personality',
      icon: <FiZap />,
      title: 'Personality Builder',
      description: 'Customize robot name, voice, and behavior',
      color: 'var(--warning-gradient)',
      active: false
    },
    {
      id: 'developer',
      icon: <FiCode />,
      title: 'Developer Mode',
      description: 'Voice commands for coding and development',
      color: 'var(--error-gradient)',
      active: false
    },
    {
      id: 'collaboration',
      icon: <FiUsers />,
      title: 'Collaboration',
      description: 'Work together with other users through robots',
      color: 'var(--info-color)',
      active: false
    }
  ];

  const handleFeatureClick = (feature) => {
    onFeatureSelect(feature.id, {
      title: feature.title,
      description: feature.description
    });
  };

  return (
    <div className="advanced-features-panel">
      <div className="panel-header">
        <h3>🚀 Advanced Features</h3>
        <p>Revolutionary capabilities that don't exist anywhere else</p>
      </div>

      <div className="features-grid">
        {features.map((feature) => (
          <motion.div
            key={feature.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`feature-item ${feature.active ? 'active' : ''}`}
            onClick={() => handleFeatureClick(feature)}
          >
            <div className="feature-icon" style={{ background: feature.color }}>
              {feature.icon}
            </div>
            <div className="feature-content">
              <h4 className="feature-title">{feature.title}</h4>
              <p className="feature-description">{feature.description}</p>
              {feature.active && (
                <div className="active-indicator">
                  <span>Active</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="panel-footer">
        <p className="footer-text">
          💡 <strong>Tip:</strong> Use voice commands like "Activate telepathy mode" or "Enable cross-service commands"
        </p>
      </div>
    </div>
  );
};

export default AdvancedFeaturesPanel;
