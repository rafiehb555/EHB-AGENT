const socketIo = require('socket.io');
const winston = require('winston');

class RealtimeManager {
    constructor(server) {
        this.io = socketIo(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        this.connectedClients = new Map();
        this.rooms = new Map();
        this.setupLogging();
        this.setupEventHandlers();
    }

    setupLogging() {
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.File({ filename: 'logs/websocket.log' }),
                new winston.transports.Console({
                    format: winston.format.simple()
                })
            ]
        });
    }

    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            this.logger.info(`🔌 Client connected: ${socket.id}`);
            this.connectedClients.set(socket.id, {
                id: socket.id,
                connectedAt: new Date(),
                rooms: [],
                user: null
            });

            // Handle authentication
            socket.on('authenticate', (data) => {
                this.handleAuthentication(socket, data);
            });

            // Handle room joining
            socket.on('join-room', (roomName) => {
                this.handleJoinRoom(socket, roomName);
            });

            // Handle room leaving
            socket.on('leave-room', (roomName) => {
                this.handleLeaveRoom(socket, roomName);
            });

            // Handle agent status updates
            socket.on('agent-status', (data) => {
                this.broadcastAgentStatus(data);
            });

            // Handle task updates
            socket.on('task-update', (data) => {
                this.broadcastTaskUpdate(data);
            });

            // Handle system alerts
            socket.on('system-alert', (data) => {
                this.broadcastSystemAlert(data);
            });

            // Handle real-time chat
            socket.on('chat-message', (data) => {
                this.handleChatMessage(socket, data);
            });

            // Handle file uploads
            socket.on('file-upload', (data) => {
                this.handleFileUpload(socket, data);
            });

            // Handle agent commands
            socket.on('agent-command', (data) => {
                this.handleAgentCommand(socket, data);
            });

            // Handle monitoring requests
            socket.on('start-monitoring', (data) => {
                this.handleStartMonitoring(socket, data);
            });

            socket.on('stop-monitoring', (data) => {
                this.handleStopMonitoring(socket, data);
            });

            // Handle disconnection
            socket.on('disconnect', () => {
                this.handleDisconnection(socket);
            });
        });
    }

    handleAuthentication(socket, data) {
        try {
            const { token, user } = data;

            if (!token || !user) {
                socket.emit('auth-error', { message: 'Invalid authentication data' });
                return;
            }

            const client = this.connectedClients.get(socket.id);
            if (client) {
                client.user = user;
                this.connectedClients.set(socket.id, client);
            }

            socket.emit('authenticated', {
                success: true,
                user: user,
                timestamp: new Date().toISOString()
            });

            this.logger.info(`✅ Client authenticated: ${socket.id} (${user.username})`);
        } catch (error) {
            this.logger.error('❌ Authentication error:', error);
            socket.emit('auth-error', { message: 'Authentication failed' });
        }
    }

    handleJoinRoom(socket, roomName) {
        try {
            socket.join(roomName);

            const client = this.connectedClients.get(socket.id);
            if (client) {
                client.rooms.push(roomName);
                this.connectedClients.set(socket.id, client);
            }

            // Initialize room if it doesn't exist
            if (!this.rooms.has(roomName)) {
                this.rooms.set(roomName, {
                    name: roomName,
                    clients: [],
                    createdAt: new Date(),
                    messages: []
                });
            }

            const room = this.rooms.get(roomName);
            room.clients.push(socket.id);

            socket.emit('room-joined', {
                room: roomName,
                clients: room.clients.length,
                timestamp: new Date().toISOString()
            });

            this.logger.info(`🏠 Client ${socket.id} joined room: ${roomName}`);
        } catch (error) {
            this.logger.error('❌ Room join error:', error);
            socket.emit('room-error', { message: 'Failed to join room' });
        }
    }

    handleLeaveRoom(socket, roomName) {
        try {
            socket.leave(roomName);

            const client = this.connectedClients.get(socket.id);
            if (client) {
                client.rooms = client.rooms.filter(room => room !== roomName);
                this.connectedClients.set(socket.id, client);
            }

            const room = this.rooms.get(roomName);
            if (room) {
                room.clients = room.clients.filter(id => id !== socket.id);
            }

            socket.emit('room-left', {
                room: roomName,
                timestamp: new Date().toISOString()
            });

            this.logger.info(`🚪 Client ${socket.id} left room: ${roomName}`);
        } catch (error) {
            this.logger.error('❌ Room leave error:', error);
        }
    }

    broadcastAgentStatus(data) {
        try {
            const { agentName, status, metrics } = data;

            this.io.emit('agent-status-update', {
                agentName,
                status,
                metrics,
                timestamp: new Date().toISOString()
            });

            this.logger.info(`📊 Agent status broadcast: ${agentName} - ${status}`);
        } catch (error) {
            this.logger.error('❌ Agent status broadcast error:', error);
        }
    }

    broadcastTaskUpdate(data) {
        try {
            const { taskId, status, progress, result, error } = data;

            this.io.emit('task-update', {
                taskId,
                status,
                progress,
                result,
                error,
                timestamp: new Date().toISOString()
            });

            this.logger.info(`🎯 Task update broadcast: ${taskId} - ${status}`);
        } catch (error) {
            this.logger.error('❌ Task update broadcast error:', error);
        }
    }

    broadcastSystemAlert(data) {
        try {
            const { type, message, severity, details } = data;

            this.io.emit('system-alert', {
                type,
                message,
                severity,
                details,
                timestamp: new Date().toISOString()
            });

            this.logger.info(`🚨 System alert broadcast: ${type} - ${message}`);
        } catch (error) {
            this.logger.error('❌ System alert broadcast error:', error);
        }
    }

    handleChatMessage(socket, data) {
        try {
            const { room, message, user } = data;

            const chatMessage = {
                id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                room,
                message,
                user,
                timestamp: new Date().toISOString()
            };

            // Store message in room
            const roomData = this.rooms.get(room);
            if (roomData) {
                roomData.messages.push(chatMessage);
                // Keep only last 100 messages
                if (roomData.messages.length > 100) {
                    roomData.messages = roomData.messages.slice(-100);
                }
            }

            // Broadcast to room
            socket.to(room).emit('chat-message', chatMessage);

            // Confirm to sender
            socket.emit('message-sent', {
                messageId: chatMessage.id,
                timestamp: new Date().toISOString()
            });

            this.logger.info(`💬 Chat message in ${room}: ${user.username}`);
        } catch (error) {
            this.logger.error('❌ Chat message error:', error);
            socket.emit('message-error', { message: 'Failed to send message' });
        }
    }

    handleFileUpload(socket, data) {
        try {
            const { fileName, fileType, fileSize, room } = data;

            const fileInfo = {
                id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                fileName,
                fileType,
                fileSize,
                room,
                uploadedBy: socket.id,
                timestamp: new Date().toISOString()
            };

            // Broadcast file upload to room
            socket.to(room).emit('file-uploaded', fileInfo);

            // Confirm to sender
            socket.emit('file-upload-success', {
                fileId: fileInfo.id,
                timestamp: new Date().toISOString()
            });

            this.logger.info(`📁 File upload: ${fileName} in ${room}`);
        } catch (error) {
            this.logger.error('❌ File upload error:', error);
            socket.emit('file-upload-error', { message: 'Failed to upload file' });
        }
    }

    handleAgentCommand(socket, data) {
        try {
            const { agentName, command, parameters } = data;

            const commandData = {
                id: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                agentName,
                command,
                parameters,
                issuedBy: socket.id,
                timestamp: new Date().toISOString()
            };

            // Broadcast command to all clients
            this.io.emit('agent-command-issued', commandData);

            // Confirm to sender
            socket.emit('command-sent', {
                commandId: commandData.id,
                timestamp: new Date().toISOString()
            });

            this.logger.info(`🤖 Agent command: ${command} for ${agentName}`);
        } catch (error) {
            this.logger.error('❌ Agent command error:', error);
            socket.emit('command-error', { message: 'Failed to issue command' });
        }
    }

    handleStartMonitoring(socket, data) {
        try {
            const { agentName, metrics } = data;

            const monitoringData = {
                agentName,
                metrics,
                startedBy: socket.id,
                timestamp: new Date().toISOString()
            };

            socket.emit('monitoring-started', monitoringData);
            this.logger.info(`📊 Monitoring started for: ${agentName}`);
        } catch (error) {
            this.logger.error('❌ Start monitoring error:', error);
            socket.emit('monitoring-error', { message: 'Failed to start monitoring' });
        }
    }

    handleStopMonitoring(socket, data) {
        try {
            const { agentName } = data;

            const monitoringData = {
                agentName,
                stoppedBy: socket.id,
                timestamp: new Date().toISOString()
            };

            socket.emit('monitoring-stopped', monitoringData);
            this.logger.info(`📊 Monitoring stopped for: ${agentName}`);
        } catch (error) {
            this.logger.error('❌ Stop monitoring error:', error);
            socket.emit('monitoring-error', { message: 'Failed to stop monitoring' });
        }
    }

    handleDisconnection(socket) {
        try {
            const client = this.connectedClients.get(socket.id);
            if (client) {
                // Remove from all rooms
                for (const roomName of client.rooms) {
                    const room = this.rooms.get(roomName);
                    if (room) {
                        room.clients = room.clients.filter(id => id !== socket.id);
                    }
                }

                this.connectedClients.delete(socket.id);
            }

            this.logger.info(`🔌 Client disconnected: ${socket.id}`);
        } catch (error) {
            this.logger.error('❌ Disconnection error:', error);
        }
    }

    // Public methods for external use
    broadcastToRoom(roomName, event, data) {
        this.io.to(roomName).emit(event, {
            ...data,
            timestamp: new Date().toISOString()
        });
    }

    broadcastToAll(event, data) {
        this.io.emit(event, {
            ...data,
            timestamp: new Date().toISOString()
        });
    }

    getConnectedClients() {
        return Array.from(this.connectedClients.values());
    }

    getRooms() {
        return Array.from(this.rooms.values());
    }

    getStats() {
        return {
            connectedClients: this.connectedClients.size,
            rooms: this.rooms.size,
            totalClients: Array.from(this.rooms.values()).reduce((sum, room) => sum + room.clients.length, 0)
        };
    }

    async healthCheck() {
        const health = {
            realtime: 'RealtimeManager',
            status: 'healthy',
            connectedClients: this.connectedClients.size,
            rooms: this.rooms.size,
            stats: this.getStats(),
            timestamp: new Date().toISOString()
        };

        this.logger.info('🏥 Realtime system health check:', health);
        return health;
    }
}

module.exports = RealtimeManager;
