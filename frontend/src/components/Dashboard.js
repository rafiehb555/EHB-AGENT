import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiPlay, FiSettings, FiZap, FiShield, FiUsers, FiCode } from 'react-icons/fi';

const Dashboard = () => {
  const features = [
    {
      icon: '🧠',
      title: 'Telepathy Mode',
      description: 'Understand unspoken intent through voice patterns',
      path: '/robot',
      color: 'var(--primary-gradient)'
    },
    {
      icon: '🔗',
      title: 'Cross-Service Commands',
      description: 'Execute multiple services with one voice command',
      path: '/advanced',
      color: 'var(--secondary-gradient)'
    },
    {
      icon: '🔒',
      title: 'Voice Vault',
      description: 'Secure voice-locked data storage',
      path: '/vault',
      color: 'var(--success-gradient)'
    },
    {
      icon: '🧬',
      title: 'Personality Builder',
      description: 'Customize robot name, voice, and behavior',
      path: '/settings',
      color: 'var(--warning-gradient)'
    },
    {
      icon: '💻',
      title: 'Developer Mode',
      description: 'Voice commands for coding and development',
      path: '/developer',
      color: 'var(--error-gradient)'
    },
    {
      icon: '🤝',
      title: 'Collaboration',
      description: 'Work together with other users through robots',
      path: '/collaboration',
      color: 'var(--info-color)'
    }
  ];

  const quickActions = [
    {
      icon: <FiPlay />,
      title: 'Start Robot',
      description: 'Begin voice interaction',
      path: '/robot',
      primary: true
    },
    {
      icon: <FiSettings />,
      title: 'Settings',
      description: 'Configure preferences',
      path: '/settings'
    },
    {
      icon: <FiZap />,
      title: 'Advanced Features',
      description: 'Access all advanced capabilities',
      path: '/advanced'
    }
  ];

  return (
    <div className="dashboard">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="dashboard-container"
      >
        {/* Hero Section */}
        <section className="hero-section">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="hero-content"
          >
            <h1 className="hero-title">
              🚀 EHB AI Robot
              <span className="hero-subtitle">SIVOS™ PRO MAX</span>
            </h1>
            <p className="hero-description">
              The world's most advanced AI assistant with revolutionary features that don't exist anywhere else.
              Experience the future of human-AI interaction.
            </p>

            <div className="hero-actions">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link to="/robot" className="btn btn-primary hero-btn">
                  <FiPlay />
                  Start Robot
                </Link>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link to="/advanced" className="btn btn-secondary hero-btn">
                  <FiZap />
                  Advanced Features
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Quick Actions */}
        <section className="quick-actions-section">
          <h2 className="section-title">Quick Actions</h2>
          <div className="quick-actions-grid">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.path}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link to={action.path} className={`quick-action-card ${action.primary ? 'primary' : ''}`}>
                  <div className="action-icon">
                    {action.icon}
                  </div>
                  <h3 className="action-title">{action.title}</h3>
                  <p className="action-description">{action.description}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Features Grid */}
        <section className="features-section">
          <h2 className="section-title">Revolutionary Features</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <motion.div
                key={feature.path}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link to={feature.path} className="feature-card">
                  <div className="feature-icon" style={{ background: feature.color }}>
                    {feature.icon}
                  </div>
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-description">{feature.description}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Stats Section */}
        <section className="stats-section">
          <h2 className="section-title">System Status</h2>
          <div className="stats-grid">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="stat-card"
            >
              <div className="stat-icon">🤖</div>
              <div className="stat-content">
                <h3 className="stat-value">Online</h3>
                <p className="stat-label">Robot Status</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="stat-card"
            >
              <div className="stat-icon">🧠</div>
              <div className="stat-content">
                <h3 className="stat-value">10</h3>
                <p className="stat-label">Advanced Features</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="stat-card"
            >
              <div className="stat-icon">🔒</div>
              <div className="stat-content">
                <h3 className="stat-value">Secure</h3>
                <p className="stat-label">Voice Vault</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="stat-card"
            >
              <div className="stat-icon">⚡</div>
              <div className="stat-content">
                <h3 className="stat-value">Real-time</h3>
                <p className="stat-label">Processing</p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="cta-section">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="cta-content"
          >
            <h2 className="cta-title">Ready to Experience the Future?</h2>
            <p className="cta-description">
              Start your journey with the world's most advanced AI assistant.
              Features that don't exist anywhere else await you.
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/robot" className="btn btn-primary cta-btn">
                🚀 Launch EHB AI Robot
              </Link>
            </motion.div>
          </motion.div>
        </section>
      </motion.div>
    </div>
  );
};

export default Dashboard;
