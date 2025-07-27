const express = require('express');
const router = express.Router();

// Mock agent data (replace with database models later)
const agents = [
  {
    id: 1,
    name: 'Frontend Agent',
    type: 'frontend',
    status: 'active',
    lastActive: new Date().toISOString(),
    capabilities: ['React', 'TypeScript', 'UI/UX', 'Component Development'],
    memory: {
      totalTasks: 150,
      completedTasks: 142,
      successRate: 94.7
    }
  },
  {
    id: 2,
    name: 'Backend Agent',
    type: 'backend',
    status: 'active',
    lastActive: new Date().toISOString(),
    capabilities: ['Node.js', 'Express', 'MongoDB', 'API Development'],
    memory: {
      totalTasks: 120,
      completedTasks: 118,
      successRate: 98.3
    }
  },
  {
    id: 3,
    name: 'Healthcare Agent',
    type: 'healthcare',
    status: 'active',
    lastActive: new Date().toISOString(),
    capabilities: ['HIPAA Compliance', 'Medical Data', 'Patient Records', 'Security'],
    memory: {
      totalTasks: 85,
      completedTasks: 83,
      successRate: 97.6
    }
  },
  {
    id: 4,
    name: 'Security Agent',
    type: 'security',
    status: 'active',
    lastActive: new Date().toISOString(),
    capabilities: ['Authentication', 'Encryption', 'Audit Logging', 'Compliance'],
    memory: {
      totalTasks: 95,
      completedTasks: 94,
      successRate: 98.9
    }
  }
];

// Get all agents
router.get('/', (req, res) => {
  try {
    res.json({
      success: true,
      data: agents,
      count: agents.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agents', message: error.message });
  }
});

// Get agent by ID
router.get('/:id', (req, res) => {
  try {
    const agent = agents.find(a => a.id === parseInt(req.params.id));
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.json({ success: true, data: agent });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agent', message: error.message });
  }
});

// Get agent status
router.get('/:id/status', (req, res) => {
  try {
    const agent = agents.find(a => a.id === parseInt(req.params.id));
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.json({
      success: true,
      data: {
        id: agent.id,
        name: agent.name,
        status: agent.status,
        lastActive: agent.lastActive,
        memory: agent.memory
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agent status', message: error.message });
  }
});

// Update agent status
router.patch('/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    const agent = agents.find(a => a.id === parseInt(req.params.id));
    
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    agent.status = status;
    agent.lastActive = new Date().toISOString();

    res.json({
      success: true,
      message: `Agent ${agent.name} status updated to ${status}`,
      data: agent
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update agent status', message: error.message });
  }
});

// Get agent memory
router.get('/:id/memory', (req, res) => {
  try {
    const agent = agents.find(a => a.id === parseInt(req.params.id));
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.json({
      success: true,
      data: {
        id: agent.id,
        name: agent.name,
        memory: agent.memory
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agent memory', message: error.message });
  }
});

// Get agent capabilities
router.get('/:id/capabilities', (req, res) => {
  try {
    const agent = agents.find(a => a.id === parseInt(req.params.id));
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.json({
      success: true,
      data: {
        id: agent.id,
        name: agent.name,
        capabilities: agent.capabilities
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agent capabilities', message: error.message });
  }
});

// Get agents by type
router.get('/type/:type', (req, res) => {
  try {
    const typeAgents = agents.filter(a => a.type === req.params.type);
    res.json({
      success: true,
      data: typeAgents,
      count: typeAgents.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agents by type', message: error.message });
  }
});

// Get system overview
router.get('/system/overview', (req, res) => {
  try {
    const totalAgents = agents.length;
    const activeAgents = agents.filter(a => a.status === 'active').length;
    const totalTasks = agents.reduce((sum, agent) => sum + agent.memory.totalTasks, 0);
    const completedTasks = agents.reduce((sum, agent) => sum + agent.memory.completedTasks, 0);
    const overallSuccessRate = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        totalAgents,
        activeAgents,
        inactiveAgents: totalAgents - activeAgents,
        totalTasks,
        completedTasks,
        pendingTasks: totalTasks - completedTasks,
        overallSuccessRate: `${overallSuccessRate}%`,
        agentsByType: agents.reduce((acc, agent) => {
          acc[agent.type] = (acc[agent.type] || 0) + 1;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch system overview', message: error.message });
  }
});

module.exports = router; 