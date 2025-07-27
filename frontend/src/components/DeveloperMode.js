import React from 'react';
import { motion } from 'framer-motion';

const DeveloperMode = () => {
  return (
    <div className="developer-mode">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="developer-mode-container"
      >
        <h1>💻 Developer Mode</h1>
        <p>Voice commands for coding and development will be available here!</p>
      </motion.div>
    </div>
  );
};

export default DeveloperMode;
