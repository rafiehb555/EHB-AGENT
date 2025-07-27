import React from 'react';
import { motion } from 'framer-motion';

const Collaboration = () => {
  return (
    <div className="collaboration">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="collaboration-container"
      >
        <h1>🤝 Collaboration</h1>
        <p>Work together with other users through robots will be available here!</p>
      </motion.div>
    </div>
  );
};

export default Collaboration;
