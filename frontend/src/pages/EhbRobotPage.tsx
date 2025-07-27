import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Settings, Zap, Shield, Globe, Users } from 'react-icons/fi';
import RobotModal from '../components/EhbRobot/RobotModal';

const EhbRobotPage = () => {
  const [isRobotModalOpen, setIsRobotModalOpen] = useState(false);

  const features = [
    {
      icon: Zap,
      title: 'Auto Actions',
      description: 'Robot performs tasks automatically based on your commands'
    },
    {
      icon: Shield,
      title: 'Secure',
      description: 'All actions are verified and logged for transparency'
    },
    {
      icon: Globe,
      title: 'Multi-language',
      description: 'Supports Urdu, English, and other languages'
    },
    {
      icon: Users,
      title: 'Role-based',
      description: 'Different robot modes for different user types'
    }
  ];

  const quickActions = [
    'Order 2 cold drinks for tomorrow',
    'Open GoSellr',
    'Check my wallet balance',
    'Book AC service for next week',
    'Show top sellers',
    'Set reminder for payment'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6">
            <Bot size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            EHB Robot
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your AI-powered assistant for browsing and using EHB services hands-free
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Icon size={24} className="text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          className="bg-white rounded-2xl p-8 shadow-lg mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Quick Actions
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {quickActions.map((action, index) => (
              <motion.button
                key={index}
                className="text-left p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors border border-gray-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsRobotModalOpen(true)}
              >
                <p className="text-gray-700 font-medium">{action}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Launch Robot Button */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <motion.button
            onClick={() => setIsRobotModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Bot size={24} className="inline mr-2" />
            Launch EHB Robot
          </motion.button>
          <p className="text-gray-600 mt-4">
            Click to start your AI assistant experience
          </p>
        </motion.div>
      </div>

      {/* Robot Modal */}
      <RobotModal
        isOpen={isRobotModalOpen}
        onClose={() => setIsRobotModalOpen(false)}
      />
    </div>
  );
};

export default EhbRobotPage;
