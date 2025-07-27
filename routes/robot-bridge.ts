import express from 'express';
import crypto from 'crypto';

const router = express.Router();

// Robot registry for global mesh
const robotRegistry = new Map<string, {
    id: string;
    name: string;
    region: string;
    language: string;
    capabilities: string[];
    status: 'online' | 'offline' | 'busy';
    lastSeen: string;
    endpoint: string;
}>();

// Message queue for robot communication
const messageQueue = new Map<string, {
    id: string;
    fromRobot: string;
    toRobot: string;
    command: string;
    userId: string;
    timestamp: string;
    status: 'pending' | 'delivered' | 'completed' | 'failed';
    response?: any;
}>();

// Initialize global robot network
const initializeRobotNetwork = () => {
    const globalRobots = [
        {
            id: 'EHB-Pakistan',
            name: 'EHB Robot Pakistan',
            region: 'Pakistan',
            language: 'urdu',
            capabilities: ['local_services', 'urdu_support', 'pakistan_compliance'],
            status: 'online',
            lastSeen: new Date().toISOString(),
            endpoint: 'https://ehb-pakistan.robot.network'
        },
        {
            id: 'EHB-Canada',
            name: 'EHB Robot Canada',
            region: 'Canada',
            language: 'english',
            capabilities: ['local_services', 'english_support', 'canada_compliance'],
            status: 'online',
            lastSeen: new Date().toISOString(),
            endpoint: 'https://ehb-canada.robot.network'
        },
        {
            id: 'EHB-UK',
            name: 'EHB Robot UK',
            region: 'United Kingdom',
            language: 'english',
            capabilities: ['local_services', 'english_support', 'uk_compliance'],
            status: 'online',
            lastSeen: new Date().toISOString(),
            endpoint: 'https://ehb-uk.robot.network'
        },
        {
            id: 'EHB-France',
            name: 'EHB Robot France',
            region: 'France',
            language: 'french',
            capabilities: ['local_services', 'french_support', 'france_compliance'],
            status: 'online',
            lastSeen: new Date().toISOString(),
            endpoint: 'https://ehb-france.robot.network'
        },
        {
            id: 'EHB-Germany',
            name: 'EHB Robot Germany',
            region: 'Germany',
            language: 'german',
            capabilities: ['local_services', 'german_support', 'germany_compliance'],
            status: 'online',
            lastSeen: new Date().toISOString(),
            endpoint: 'https://ehb-germany.robot.network'
        }
    ];

    globalRobots.forEach(robot => {
        robotRegistry.set(robot.id, robot);
    });

    console.log('✅ Global robot network initialized');
};

// Initialize on startup
initializeRobotNetwork();

// POST /robot-bridge - Send command to another robot
router.post('/', async (req, res) => {
    try {
        const { fromRobot, toRobot, command, userId } = req.body;

        if (!fromRobot || !toRobot || !command || !userId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: fromRobot, toRobot, command, userId'
            });
        }

        // Check if target robot exists
        const targetRobot = robotRegistry.get(toRobot);
        if (!targetRobot) {
            return res.status(404).json({
                success: false,
                error: `Robot ${toRobot} not found in global network`
            });
        }

        // Check if target robot is online
        if (targetRobot.status === 'offline') {
            return res.status(503).json({
                success: false,
                error: `Robot ${toRobot} is currently offline`
            });
        }

        // Create message
        const messageId = crypto.randomUUID();
        const message = {
            id: messageId,
            fromRobot,
            toRobot,
            command,
            userId,
            timestamp: new Date().toISOString(),
            status: 'pending' as const
        };

        // Add to queue
        messageQueue.set(messageId, message);

        // Simulate robot communication
        const response = await simulateRobotCommunication(message);

        // Update message status
        message.status = response.success ? 'completed' : 'failed';
        message.response = response;

        res.json({
            success: true,
            messageId,
            response: response.message,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Robot bridge error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send robot command'
        });
    }
});

// GET /robot-bridge/robots - Get all available robots
router.get('/robots', (req, res) => {
    try {
        const robots = Array.from(robotRegistry.values());

        res.json({
            success: true,
            robots,
            total: robots.length,
            online: robots.filter(r => r.status === 'online').length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Get robots error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get robot list'
        });
    }
});

// GET /robot-bridge/robots/:region - Get robots by region
router.get('/robots/:region', (req, res) => {
    try {
        const { region } = req.params;
        const robots = Array.from(robotRegistry.values())
            .filter(robot => robot.region.toLowerCase() === region.toLowerCase());

        res.json({
            success: true,
            region,
            robots,
            count: robots.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Get robots by region error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get robots by region'
        });
    }
});

// GET /robot-bridge/messages - Get message history
router.get('/messages', (req, res) => {
    try {
        const { fromRobot, toRobot, status } = req.query;
        let messages = Array.from(messageQueue.values());

        // Filter by parameters
        if (fromRobot) {
            messages = messages.filter(m => m.fromRobot === fromRobot);
        }
        if (toRobot) {
            messages = messages.filter(m => m.toRobot === toRobot);
        }
        if (status) {
            messages = messages.filter(m => m.status === status);
        }

        res.json({
            success: true,
            messages,
            total: messages.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get message history'
        });
    }
});

// POST /robot-bridge/register - Register a new robot
router.post('/register', (req, res) => {
    try {
        const { id, name, region, language, capabilities, endpoint } = req.body;

        if (!id || !name || !region || !language || !capabilities || !endpoint) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields for robot registration'
            });
        }

        // Check if robot already exists
        if (robotRegistry.has(id)) {
            return res.status(409).json({
                success: false,
                error: `Robot ${id} already registered`
            });
        }

        // Register new robot
        const newRobot = {
            id,
            name,
            region,
            language,
            capabilities: Array.isArray(capabilities) ? capabilities : [capabilities],
            status: 'online' as const,
            lastSeen: new Date().toISOString(),
            endpoint
        };

        robotRegistry.set(id, newRobot);

        res.json({
            success: true,
            message: `Robot ${id} registered successfully`,
            robot: newRobot,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Register robot error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to register robot'
        });
    }
});

// POST /robot-bridge/heartbeat - Update robot status
router.post('/heartbeat', (req, res) => {
    try {
        const { robotId, status = 'online' } = req.body;

        if (!robotId) {
            return res.status(400).json({
                success: false,
                error: 'Robot ID is required'
            });
        }

        const robot = robotRegistry.get(robotId);
        if (!robot) {
            return res.status(404).json({
                success: false,
                error: `Robot ${robotId} not found`
            });
        }

        // Update robot status
        robot.status = status;
        robot.lastSeen = new Date().toISOString();

        res.json({
            success: true,
            message: `Robot ${robotId} status updated to ${status}`,
            robot,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Robot heartbeat error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update robot status'
        });
    }
});

// POST /robot-bridge/route - Route command to appropriate robot
router.post('/route', async (req, res) => {
    try {
        const { command, userId, preferredLanguage, preferredRegion } = req.body;

        if (!command || !userId) {
            return res.status(400).json({
                success: false,
                error: 'Command and userId are required'
            });
        }

        // Find best robot for the command
        const bestRobot = findBestRobot(command, preferredLanguage, preferredRegion);

        if (!bestRobot) {
            return res.status(404).json({
                success: false,
                error: 'No suitable robot found for this command'
            });
        }

        // Send command to best robot
        const messageId = crypto.randomUUID();
        const message = {
            id: messageId,
            fromRobot: 'EHB-Global-Router',
            toRobot: bestRobot.id,
            command,
            userId,
            timestamp: new Date().toISOString(),
            status: 'pending' as const
        };

        messageQueue.set(messageId, message);

        // Simulate robot communication
        const response = await simulateRobotCommunication(message);

        res.json({
            success: true,
            routedTo: bestRobot.name,
            region: bestRobot.region,
            language: bestRobot.language,
            response: response.message,
            messageId,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Route command error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to route command'
        });
    }
});

// Helper functions
function findBestRobot(command: string, preferredLanguage?: string, preferredRegion?: string) {
    const availableRobots = Array.from(robotRegistry.values())
        .filter(robot => robot.status === 'online');

    if (availableRobots.length === 0) {
        return null;
    }

    // If preferred region is specified, prioritize robots from that region
    if (preferredRegion) {
        const regionalRobots = availableRobots.filter(robot =>
            robot.region.toLowerCase() === preferredRegion.toLowerCase()
        );
        if (regionalRobots.length > 0) {
            return regionalRobots[0];
        }
    }

    // If preferred language is specified, prioritize robots with that language
    if (preferredLanguage) {
        const languageRobots = availableRobots.filter(robot =>
            robot.language.toLowerCase() === preferredLanguage.toLowerCase()
        );
        if (languageRobots.length > 0) {
            return languageRobots[0];
        }
    }

    // Default to first available robot
    return availableRobots[0];
}

async function simulateRobotCommunication(message: any) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simulate robot response based on command
    const commandLower = message.command.toLowerCase();

    if (commandLower.includes('book') || commandLower.includes('appointment')) {
        return {
            success: true,
            message: `✅ ${message.toRobot} has booked your appointment. Confirmation sent to your email.`,
            data: {
                appointmentId: `apt_${Date.now()}`,
                status: 'confirmed',
                robot: message.toRobot
            }
        };
    } else if (commandLower.includes('order') || commandLower.includes('delivery')) {
        return {
            success: true,
            message: `✅ ${message.toRobot} has placed your order. Delivery scheduled for tomorrow.`,
            data: {
                orderId: `ord_${Date.now()}`,
                status: 'confirmed',
                robot: message.toRobot
            }
        };
    } else if (commandLower.includes('service') || commandLower.includes('maintenance')) {
        return {
            success: true,
            message: `✅ ${message.toRobot} has scheduled your service appointment. Technician will contact you soon.`,
            data: {
                serviceId: `svc_${Date.now()}`,
                status: 'scheduled',
                robot: message.toRobot
            }
        };
    } else {
        return {
            success: true,
            message: `✅ ${message.toRobot} has processed your request: "${message.command}"`,
            data: {
                requestId: `req_${Date.now()}`,
                status: 'completed',
                robot: message.toRobot
            }
        };
    }
}

// Get robot network statistics
router.get('/statistics', (req, res) => {
    try {
        const robots = Array.from(robotRegistry.values());
        const messages = Array.from(messageQueue.values());

        const stats = {
            totalRobots: robots.length,
            onlineRobots: robots.filter(r => r.status === 'online').length,
            offlineRobots: robots.filter(r => r.status === 'offline').length,
            totalMessages: messages.length,
            pendingMessages: messages.filter(m => m.status === 'pending').length,
            completedMessages: messages.filter(m => m.status === 'completed').length,
            failedMessages: messages.filter(m => m.status === 'failed').length,
            regions: [...new Set(robots.map(r => r.region))],
            languages: [...new Set(robots.map(r => r.language))]
        };

        res.json({
            success: true,
            statistics: stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Get statistics error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get network statistics'
        });
    }
});

export default router;
