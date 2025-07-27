import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import RobotInterface from './components/RobotInterface';
import Dashboard from './components/Dashboard';
import AdvancedFeatures from './components/AdvancedFeatures';
import Settings from './components/Settings';
import VoiceVault from './components/VoiceVault';
import DeveloperMode from './components/DeveloperMode';
import Collaboration from './components/Collaboration';
import LegalAssistant from './components/LegalAssistant';
import FranchiseCourt from './components/FranchiseCourt';
import RobotButton from './components/EhbRobot/RobotButton';
import RobotModal from './components/EhbRobot/RobotModal';

// Hooks
import { useRobotStore } from './hooks/useRobotStore';

// Styles
import './App.css';

function App() {
  const { isConnected, robotStatus } = useRobotStore();
  const [isRobotModalOpen, setIsRobotModalOpen] = useState(false);

  const handleOpenRobotModal = () => {
    setIsRobotModalOpen(true);
  };

  const handleCloseRobotModal = () => {
    setIsRobotModalOpen(false);
  };

  return (
    <div className="App">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="app-container"
      >
        {/* Header */}
        <Header />

        {/* Main Content */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/robot" element={<RobotInterface />} />
            <Route path="/advanced" element={<AdvancedFeatures />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/vault" element={<VoiceVault />} />
            <Route path="/developer" element={<DeveloperMode />} />
            <Route path="/collaboration" element={<Collaboration />} />
            <Route path="/legal" element={<LegalAssistant />} />
            <Route path="/court" element={<FranchiseCourt />} />
          </Routes>
        </main>

        {/* Footer */}
        <Footer />

        {/* Floating Robot Button */}
        <motion.div
          className="floating-robot-button"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <div className={`robot-status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            <div className="robot-icon">
              🤖
            </div>
            <div className="status-text">
              {robotStatus}
            </div>
          </div>
        </motion.div>

        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#333',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />

        {/* EHB Robot Components */}
        <RobotButton onOpenModal={handleOpenRobotModal} />
        <RobotModal
          isOpen={isRobotModalOpen}
          onClose={handleCloseRobotModal}
        />
      </motion.div>
    </div>
  );
}

export default App;
