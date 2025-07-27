import React from 'react';
import { motion } from 'framer-motion';

const LegalAssistant = () => {
  return (
    <div className="legal-assistant">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="legal-assistant-container"
      >
        <h1>⚖️ Legal Assistant</h1>
        <p>AI-powered legal document generation will be available here!</p>
      </motion.div>
    </div>
  );
};

export default LegalAssistant;
