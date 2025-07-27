import React from 'react';

interface EhbAgentCardProps {
  name: string;
  version: string;
  status: 'Active' | 'Inactive' | 'Error' | 'Processing';
  features: string[];
  onLaunch: () => void;
  onViewReport?: () => void;
  onAssignProject?: () => void;
  healthScore?: number;
  lastActivity?: string;
  agentType?: string;
}

const EhbAgentCard: React.FC<EhbAgentCardProps> = ({
  name,
  version,
  status,
  features,
  onLaunch,
  onViewReport,
  onAssignProject,
  healthScore,
  lastActivity,
  agentType = 'AI Development'
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Inactive':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'Error':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Processing':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getHealthColor = (score?: number) => {
    if (!score) return 'text-gray-400';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div role="presentation" className="bg-white shadow-lg rounded-2xl border border-gray-200 p-6 w-full max-w-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1" role="presentation">
      {/* Header */}
      <div role="presentation" className="flex justify-between items-start mb-4" role="presentation">
        <div role="presentation" role="presentation">
          <h2 role="heading" className="text-xl font-bold text-gray-800 mb-1">{name}</h2>
          <p role="text" className="text-sm text-gray-600">Version: {version}</p>
          <p role="text" className="text-xs text-gray-500 mt-1">{agentType}</p>
        </div>
        <div role="presentation" className="flex flex-col items-end space-y-2" role="presentation">
          <span
            className={`text-xs px-3 py-1 rounded-full border ${getStatusColor(status)} font-medium`}
          >
            {status}
          </span>
          {healthScore && (
            <div role="presentation" className="text-right" role="presentation">
              <span role="text" className={`text-sm font-semibold ${getHealthColor(healthScore)}`}>
                Health: {healthScore}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Features List */}
      <div role="presentation" className="mb-6" role="presentation">
        <h3 role="heading" className="text-sm font-semibold text-gray-700 mb-3">Features:</h3>
        <ul className="text-xs text-gray-700 space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <span role="text" className="text-green-500 mr-2 mt-0.5">✓</span>
              <span role="text" role="text">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Activity Info */}
      {lastActivity && (
        <div role="presentation" className="mb-4 p-3 bg-gray-50 rounded-lg" role="presentation">
          <p role="text" className="text-xs text-gray-600">
            Last Activity: {lastActivity}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div role="presentation" className="flex flex-wrap gap-2" role="presentation">
        <button
          onClick={onLaunch}
          className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium flex-1"
         aria-label="Button">
          🚀 Launch Agent
        </button>
        
        {onViewReport && (
          <button
            onClick={onViewReport}
            className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
           aria-label="Button">
            📊 View Report
          </button>
        )}
        
        {onAssignProject && (
          <button
            onClick={onAssignProject}
            className="px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors duration-200 font-medium"
           aria-label="Button">
            📁 Assign Project
          </button>
        )}
      </div>

      {/* Quick Stats */}
      <div role="presentation" className="mt-4 pt-4 border-t border-gray-100" role="presentation">
        <div role="presentation" className="flex justify-between text-xs text-gray-500" role="presentation">
          <span role="text" role="text">Type: {agentType}</span>
          <span role="text" role="text">Status: {status}</span>
        </div>
      </div>
    </div>
  );
};

export default EhbAgentCard; 