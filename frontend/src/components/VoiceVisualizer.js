import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const VoiceVisualizer = ({ isListening }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!isListening) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const drawVisualizer = () => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, 'rgba(102, 126, 234, 0.3)');
      gradient.addColorStop(1, 'rgba(118, 75, 162, 0.3)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw animated bars
      const barCount = 20;
      const barWidth = width / barCount;

      for (let i = 0; i < barCount; i++) {
        const x = i * barWidth;
        const barHeight = Math.random() * height * 0.8;
        const y = height - barHeight;

        // Create bar gradient
        const barGradient = ctx.createLinearGradient(x, y, x, height);
        barGradient.addColorStop(0, 'rgba(102, 126, 234, 0.8)');
        barGradient.addColorStop(1, 'rgba(118, 75, 162, 0.8)');

        ctx.fillStyle = barGradient;
        ctx.fillRect(x + 2, y, barWidth - 4, barHeight);

        // Add glow effect
        ctx.shadowColor = 'rgba(102, 126, 234, 0.5)';
        ctx.shadowBlur = 10;
        ctx.fillRect(x + 2, y, barWidth - 4, barHeight);
        ctx.shadowBlur = 0;
      }

      animationRef.current = requestAnimationFrame(drawVisualizer);
    };

    drawVisualizer();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isListening]);

  if (!isListening) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="voice-visualizer"
    >
      <div className="visualizer-container">
        <div className="visualizer-header">
          <div className="listening-indicator">
            <div className="pulse-dot"></div>
            <span>Listening...</span>
          </div>
        </div>

        <canvas
          ref={canvasRef}
          width={300}
          height={100}
          className="visualizer-canvas"
        />

        <div className="visualizer-footer">
          <p>Speak now to interact with EHB AI Robot</p>
        </div>
      </div>
    </motion.div>
  );
};

export default VoiceVisualizer;
