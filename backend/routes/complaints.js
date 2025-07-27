const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const { OpenAI } = require('openai');
require('dotenv').config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Get all complaints
router.get('/', async (req, res) => {
  try {
    const { status, category, priority, complainantId, page = 1, limit = 20 } = req.query;

    let query = {};

    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (complainantId) query['complainant.userId'] = complainantId;

    const complaints = await Complaint.find(query)
      .sort({ 'timeline.submittedAt': -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Complaint.countDocuments(query);

    res.json({
      success: true,
      complaints,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get complaints'
    });
  }
});

// Get complaint by ID
router.get('/:complaintId', async (req, res) => {
  try {
    const { complaintId } = req.params;

    const complaint = await Complaint.findOne({ complaintId });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Complaint not found'
      });
    }

    res.json({
      success: true,
      complaint
    });
  } catch (error) {
    console.error('Get complaint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get complaint'
    });
  }
});

// Create new complaint
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      complainant,
      relatedTo,
      location,
      priority = 'medium',
      severity = 'moderate'
    } = req.body;

    // Generate unique complaint ID
    const complaintId = `CMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // AI analysis of complaint
    const aiAnalysis = await analyzeComplaint(description, category);

    // Create complaint record
    const complaint = new Complaint({
      complaintId,
      title,
      description,
      category,
      complainant,
      relatedTo,
      location,
      priority,
      severity,
      status: 'open',
      aiAnalysis,
      timeline: {
        submittedAt: new Date()
      }
    });

    // Calculate risk score
    await complaint.calculateRiskScore();

    await complaint.save();

    res.json({
      success: true,
      complaint,
      message: 'Complaint filed successfully'
    });
  } catch (error) {
    console.error('Create complaint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create complaint'
    });
  }
});

// AI analysis of complaint
async function analyzeComplaint(description, category) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an AI complaint analyzer. Analyze the complaint and provide:
          1. Sentiment (positive, neutral, negative)
          2. Urgency level (low, medium, high, critical)
          3. Suggested resolution
          4. Risk assessment (0-100)
          5. Automated response

          Return as JSON object.`
        },
        {
          role: 'user',
          content: `Complaint Category: ${category}
          Description: ${description}

          Analyze this complaint and provide structured response.`
        }
      ],
      max_tokens: 500
    });

    const analysis = JSON.parse(response.choices[0].message.content);

    return {
      sentiment: analysis.sentiment || 'neutral',
      urgency: analysis.urgency || 'medium',
      suggestedResolution: analysis.suggestedResolution || '',
      riskScore: analysis.riskAssessment || 50,
      automatedResponse: analysis.automatedResponse || ''
    };
  } catch (error) {
    console.error('AI analysis error:', error);
    return {
      sentiment: 'neutral',
      urgency: 'medium',
      suggestedResolution: '',
      riskScore: 50,
      automatedResponse: ''
    };
  }
}

// Assign complaint to handler
router.post('/:complaintId/assign', async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { assignedTo } = req.body;

    const complaint = await Complaint.findOne({ complaintId });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Complaint not found'
      });
    }

    await complaint.assignTo(assignedTo);

    // Add communication
    await complaint.addCommunication({
      type: 'internal_note',
      from: { userId: 'system', name: 'System', role: 'admin' },
      to: assignedTo,
      subject: 'Complaint Assigned',
      message: `Complaint ${complaintId} has been assigned to you for resolution.`,
      isInternal: true,
      timestamp: new Date()
    });

    res.json({
      success: true,
      complaint,
      message: 'Complaint assigned successfully'
    });
  } catch (error) {
    console.error('Assign complaint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign complaint'
    });
  }
});

// Escalate complaint
router.post('/:complaintId/escalate', async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { reason, escalatedTo } = req.body;

    const complaint = await Complaint.findOne({ complaintId });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Complaint not found'
      });
    }

    await complaint.escalate(reason, escalatedTo);

    // Add communication
    await complaint.addCommunication({
      type: 'escalation',
      from: { userId: 'system', name: 'System', role: 'admin' },
      to: escalatedTo,
      subject: 'Complaint Escalated',
      message: `Complaint ${complaintId} has been escalated. Reason: ${reason}`,
      isInternal: true,
      timestamp: new Date()
    });

    res.json({
      success: true,
      complaint,
      message: 'Complaint escalated successfully'
    });
  } catch (error) {
    console.error('Escalate complaint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to escalate complaint'
    });
  }
});

// Resolve complaint
router.post('/:complaintId/resolve', async (req, res) => {
  try {
    const { complaintId } = req.params;
    const resolution = req.body;

    const complaint = await Complaint.findOne({ complaintId });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Complaint not found'
      });
    }

    await complaint.resolve(resolution);

    // Add communication
    await complaint.addCommunication({
      type: 'customer_response',
      from: { userId: resolution.resolvedBy.userId, name: resolution.resolvedBy.name, role: 'support' },
      to: complaint.complainant,
      subject: 'Complaint Resolved',
      message: `Your complaint has been resolved. Solution: ${resolution.solution}`,
      isInternal: false,
      timestamp: new Date()
    });

    res.json({
      success: true,
      complaint,
      message: 'Complaint resolved successfully'
    });
  } catch (error) {
    console.error('Resolve complaint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve complaint'
    });
  }
});

// Close complaint
router.post('/:complaintId/close', async (req, res) => {
  try {
    const { complaintId } = req.params;

    const complaint = await Complaint.findOne({ complaintId });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Complaint not found'
      });
    }

    await complaint.close();

    res.json({
      success: true,
      complaint,
      message: 'Complaint closed successfully'
    });
  } catch (error) {
    console.error('Close complaint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to close complaint'
    });
  }
});

// Add communication to complaint
router.post('/:complaintId/communication', async (req, res) => {
  try {
    const { complaintId } = req.params;
    const communication = req.body;

    const complaint = await Complaint.findOne({ complaintId });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Complaint not found'
      });
    }

    await complaint.addCommunication(communication);

    res.json({
      success: true,
      complaint,
      message: 'Communication added successfully'
    });
  } catch (error) {
    console.error('Add communication error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add communication'
    });
  }
});

// Get urgent complaints
router.get('/urgent/list', async (req, res) => {
  try {
    const urgentComplaints = await Complaint.findUrgent();

    res.json({
      success: true,
      complaints: urgentComplaints
    });
  } catch (error) {
    console.error('Get urgent complaints error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get urgent complaints'
    });
  }
});

// Get complaints by status
router.get('/status/:status', async (req, res) => {
  try {
    const { status } = req.params;

    const complaints = await Complaint.findByStatus(status);

    res.json({
      success: true,
      complaints
    });
  } catch (error) {
    console.error('Get complaints by status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get complaints by status'
    });
  }
});

// Get complaints by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;

    const complaints = await Complaint.findByCategory(category);

    res.json({
      success: true,
      complaints
    });
  } catch (error) {
    console.error('Get complaints by category error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get complaints by category'
    });
  }
});

// Get complaints by complainant
router.get('/complainant/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const complaints = await Complaint.findByComplainant(userId);

    res.json({
      success: true,
      complaints
    });
  } catch (error) {
    console.error('Get complaints by complainant error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get complaints by complainant'
    });
  }
});

// Get complaints by assignee
router.get('/assignee/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const complaints = await Complaint.findByAssignee(userId);

    res.json({
      success: true,
      complaints
    });
  } catch (error) {
    console.error('Get complaints by assignee error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get complaints by assignee'
    });
  }
});

// Get complaint statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await Complaint.getComplaintStats();

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get complaint stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get complaint statistics'
    });
  }
});

// Get category statistics
router.get('/stats/categories', async (req, res) => {
  try {
    const stats = await Complaint.getCategoryStats();

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get category stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get category statistics'
    });
  }
});

// Update complaint SLA
router.post('/:complaintId/update-sla', async (req, res) => {
  try {
    const { complaintId } = req.params;

    const complaint = await Complaint.findOne({ complaintId });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Complaint not found'
      });
    }

    await complaint.updateSLA();

    res.json({
      success: true,
      complaint,
      message: 'SLA updated successfully'
    });
  } catch (error) {
    console.error('Update SLA error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update SLA'
    });
  }
});

// Mark notification as read
router.post('/:complaintId/notifications/:notificationId/read', async (req, res) => {
  try {
    const { complaintId, notificationId } = req.params;

    const complaint = await Complaint.findOne({ complaintId });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Complaint not found'
      });
    }

    await complaint.markNotificationAsRead(notificationId);

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
});

// AI-powered complaint analysis
router.post('/analyze', async (req, res) => {
  try {
    const { description, category, complainant } = req.body;

    const analysis = await analyzeComplaint(description, category);

    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Analyze complaint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze complaint'
    });
  }
});

module.exports = router;
