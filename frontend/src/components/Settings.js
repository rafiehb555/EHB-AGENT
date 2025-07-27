import React from 'react';
import { motion } from 'framer-motion';

const Settings = () => {
  return (
    <div className="settings">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="settings-container"
      >
        <h1>⚙️ Settings</h1>
        <p>Robot configuration and preferences will be available here!</p>
      </motion.div>
    </div>
  );
};

export default Settings;
