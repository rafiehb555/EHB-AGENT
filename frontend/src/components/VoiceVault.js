import React from 'react';
import { motion } from 'framer-motion';

const VoiceVault = () => {
  return (
    <div className="voice-vault">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="voice-vault-container"
      >
        <h1>🔒 Voice Vault</h1>
        <p>Secure voice-locked data storage will be available here!</p>
      </motion.div>
    </div>
  );
};

export default VoiceVault;
