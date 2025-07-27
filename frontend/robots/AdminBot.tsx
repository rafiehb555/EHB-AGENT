import React, { useState, useEffect } from 'react';

interface AdminTask {
    id: string;
    type: 'fraud' | 'system' | 'franchise' | 'wallet' | 'report';
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
    createdAt: string;
    completedAt?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
}

interface SystemMetric {
    name: string;
    value: number;
    unit: string;
    trend: 'up' | 'down' | 'stable';
    change: number;
}

interface FraudAlert {
    id: string;
    type: 'wallet' | 'transaction' | 'account' | 'system';
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'investigating' | 'resolved' | 'escalated';
    createdAt: string;
    affectedUsers: number;
    potentialLoss: number;
}

interface FranchiseApplication {
    id: string;
    name: string;
    location: string;
    applicant: string;
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: string;
    documents: string[];
    investment: number;
}

interface WalletViolation {
    id: string;
    userId: string;
    violation: string;
    amount: number;
    status: 'pending' | 'frozen' | 'resolved';
    createdAt: string;
    description: string;
}

class AdminBot {
    private tasks: AdminTask[] = [];
    private fraudAlerts: FraudAlert[] = [];
    private franchiseApplications: FranchiseApplication[] = [];
    private walletViolations: WalletViolation[] = [];
    private systemMetrics: SystemMetric[] = [];
    private autoMode: boolean = true;
    private adminId: string;

    constructor(adminId: string) {
        this.adminId = adminId;
        this.initializeData();
        this.startAutoMonitoring();
        console.log('👨‍💼 Admin Bot initialized for admin:', adminId);
    }

    private initializeData() {
        // Initialize system metrics
        this.systemMetrics = [
            {
                name: 'Total Revenue',
                value: 125000,
                unit: 'USD',
                trend: 'up',
                change: 12.5
            },
            {
                name: 'Active Users',
                value: 15420,
                unit: 'users',
                trend: 'up',
                change: 8.3
            },
            {
                name: 'Active Franchises',
                value: 342,
                unit: 'franchises',
                trend: 'up',
                change: 5.2
            },
            {
                name: 'System Uptime',
                value: 99.8,
                unit: '%',
                trend: 'stable',
                change: 0.1
            },
            {
                name: 'Transaction Success Rate',
                value: 98.7,
                unit: '%',
                trend: 'up',
                change: 1.2
            },
            {
                name: 'Customer Satisfaction',
                value: 4.6,
                unit: '/5',
                trend: 'up',
                change: 0.2
            }
        ];

        // Initialize fraud alerts
        this.fraudAlerts = [
            {
                id: 'fraud_1',
                type: 'wallet',
                description: 'Multiple wallet violations detected - 10+ accounts with token lock violations',
                severity: 'high',
                status: 'open',
                createdAt: new Date(Date.now() - 3600000).toISOString(),
                affectedUsers: 12,
                potentialLoss: 2500
            },
            {
                id: 'fraud_2',
                type: 'transaction',
                description: 'Suspicious transaction pattern detected in District Karachi',
                severity: 'medium',
                status: 'investigating',
                createdAt: new Date(Date.now() - 7200000).toISOString(),
                affectedUsers: 3,
                potentialLoss: 800
            }
        ];

        // Initialize franchise applications
        this.franchiseApplications = [
            {
                id: 'app_1',
                name: 'Karachi Central Branch',
                location: 'Karachi, Pakistan',
                applicant: 'Ahmed Hassan',
                status: 'pending',
                submittedAt: new Date(Date.now() - 86400000).toISOString(),
                documents: ['Business Plan', 'Financial Statement', 'Location Photos'],
                investment: 50000
            },
            {
                id: 'app_2',
                name: 'Lahore University Branch',
                location: 'Lahore, Pakistan',
                applicant: 'Fatima Ali',
                status: 'pending',
                submittedAt: new Date(Date.now() - 172800000).toISOString(),
                documents: ['Business Plan', 'Financial Statement'],
                investment: 45000
            }
        ];

        // Initialize wallet violations
        this.walletViolations = [
            {
                id: 'violation_1',
                userId: 'user_123',
                violation: 'Token lock violation',
                amount: 500,
                status: 'pending',
                createdAt: new Date(Date.now() - 1800000).toISOString(),
                description: 'User withdrew tokens before lock period ended'
            },
            {
                id: 'violation_2',
                userId: 'user_456',
                violation: 'Multiple account creation',
                amount: 0,
                status: 'frozen',
                createdAt: new Date(Date.now() - 3600000).toISOString(),
                description: 'User created multiple accounts with same identity'
            }
        ];
    }

    private startAutoMonitoring() {
        // Check fraud alerts every 15 minutes
        setInterval(() => {
            this.checkFraudAlerts();
        }, 900000);

        // Check system health every 30 minutes
        setInterval(() => {
            this.checkSystemHealth();
        }, 1800000);

        // Generate daily reports
        setInterval(() => {
            this.generateDailyReport();
        }, 86400000);
    }

    // Check fraud alerts and escalate if needed
    private checkFraudAlerts() {
        const openAlerts = this.fraudAlerts.filter(alert => alert.status === 'open');

        openAlerts.forEach(alert => {
            if (alert.severity === 'critical' || alert.potentialLoss > 1000) {
                this.escalateFraudAlert(alert.id);
            }
        });
    }

    // Check system health
    private checkSystemHealth() {
        const uptime = this.systemMetrics.find(m => m.name === 'System Uptime');
        const successRate = this.systemMetrics.find(m => m.name === 'Transaction Success Rate');

        if (uptime && uptime.value < 99.5) {
            this.createTask('system', 'System Uptime Alert',
                `System uptime has dropped to ${uptime.value}%. Immediate attention required.`,
                'high');
        }

        if (successRate && successRate.value < 95) {
            this.createTask('system', 'Transaction Success Rate Alert',
                `Transaction success rate has dropped to ${successRate.value}%. Investigation needed.`,
                'high');
        }
    }

    // Generate daily report
    private generateDailyReport() {
        const totalRevenue = this.systemMetrics.find(m => m.name === 'Total Revenue')?.value || 0;
        const activeUsers = this.systemMetrics.find(m => m.name === 'Active Users')?.value || 0;
        const openFraudAlerts = this.fraudAlerts.filter(alert => alert.status === 'open').length;

        this.createTask('report', 'Daily System Report Generated',
            `Daily summary: $${totalRevenue} revenue, ${activeUsers} active users, ${openFraudAlerts} open fraud alerts.`,
            'medium');
    }

    // Create a new task
    private createTask(type: AdminTask['type'], title: string, description: string, priority: AdminTask['priority'] = 'medium') {
        const task: AdminTask = {
            id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            title,
            description,
            priority,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        this.tasks.push(task);
        return task;
    }

    // Escalate fraud alert
    private escalateFraudAlert(alertId: string) {
        const alert = this.fraudAlerts.find(a => a.id === alertId);
        if (alert) {
            alert.status = 'escalated';

            this.createTask('fraud', `Fraud Alert Escalated`,
                `Fraud alert "${alert.description}" has been escalated due to high severity.`,
                'urgent');
        }
    }

    // Approve franchise application
    approveFranchiseApplication(appId: string) {
        const application = this.franchiseApplications.find(app => app.id === appId);
        if (application) {
            application.status = 'approved';

            this.createTask('franchise', `Franchise Application Approved`,
                `Franchise application for ${application.name} has been approved.`,
                'medium');
        }
    }

    // Reject franchise application
    rejectFranchiseApplication(appId: string, reason: string) {
        const application = this.franchiseApplications.find(app => app.id === appId);
        if (application) {
            application.status = 'rejected';

            this.createTask('franchise', `Franchise Application Rejected`,
                `Franchise application for ${application.name} has been rejected. Reason: ${reason}`,
                'medium');
        }
    }

    // Freeze wallet
    freezeWallet(userId: string, reason: string) {
        const violation = this.walletViolations.find(v => v.userId === userId);
        if (violation) {
            violation.status = 'frozen';

            this.createTask('wallet', `Wallet Frozen`,
                `Wallet for user ${userId} has been frozen. Reason: ${reason}`,
                'high');
        }
    }

    // Get system summary
    getSystemSummary(): {
        totalRevenue: number;
        activeUsers: number;
        activeFranchises: number;
        systemUptime: number;
        openFraudAlerts: number;
        pendingApplications: number;
        walletViolations: number;
        suggestions: string[];
    } {
        const totalRevenue = this.systemMetrics.find(m => m.name === 'Total Revenue')?.value || 0;
        const activeUsers = this.systemMetrics.find(m => m.name === 'Active Users')?.value || 0;
        const activeFranchises = this.systemMetrics.find(m => m.name === 'Active Franchises')?.value || 0;
        const systemUptime = this.systemMetrics.find(m => m.name === 'System Uptime')?.value || 0;
        const openFraudAlerts = this.fraudAlerts.filter(alert => alert.status === 'open').length;
        const pendingApplications = this.franchiseApplications.filter(app => app.status === 'pending').length;
        const walletViolations = this.walletViolations.filter(v => v.status === 'pending').length;

        const suggestions = [];
        if (openFraudAlerts > 0) {
            suggestions.push(`${openFraudAlerts} fraud alerts need immediate attention`);
        }
        if (pendingApplications > 0) {
            suggestions.push(`${pendingApplications} franchise applications pending approval`);
        }
        if (walletViolations > 0) {
            suggestions.push(`${walletViolations} wallet violations detected - freeze accounts?`);
        }
        if (systemUptime < 99.5) {
            suggestions.push(`System uptime at ${systemUptime}% - investigate immediately`);
        }

        return {
            totalRevenue,
            activeUsers,
            activeFranchises,
            systemUptime,
            openFraudAlerts,
            pendingApplications,
            walletViolations,
            suggestions
        };
    }

    // Get all tasks
    getTasks(): AdminTask[] {
        return this.tasks;
    }

    // Get fraud alerts
    getFraudAlerts(): FraudAlert[] {
        return this.fraudAlerts;
    }

    // Get franchise applications
    getFranchiseApplications(): FranchiseApplication[] {
        return this.franchiseApplications;
    }

    // Get wallet violations
    getWalletViolations(): WalletViolation[] {
        return this.walletViolations;
    }

    // Get system metrics
    getSystemMetrics(): SystemMetric[] {
        return this.systemMetrics;
    }

    // Toggle auto mode
    toggleAutoMode(): boolean {
        this.autoMode = !this.autoMode;
        return this.autoMode;
    }

    // Get auto mode status
    getAutoMode(): boolean {
        return this.autoMode;
    }
}

// React Component for Admin Bot
const AdminBotComponent: React.FC = () => {
    const [adminBot] = useState(() => new AdminBot('admin_123'));
    const [tasks, setTasks] = useState<AdminTask[]>([]);
    const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
    const [franchiseApplications, setFranchiseApplications] = useState<FranchiseApplication[]>([]);
    const [walletViolations, setWalletViolations] = useState<WalletViolation[]>([]);
    const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [autoMode, setAutoMode] = useState(true);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'fraud' | 'applications' | 'violations' | 'metrics' | 'tasks'>('dashboard');

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const loadData = () => {
        setTasks(adminBot.getTasks());
        setFraudAlerts(adminBot.getFraudAlerts());
        setFranchiseApplications(adminBot.getFranchiseApplications());
        setWalletViolations(adminBot.getWalletViolations());
        setSystemMetrics(adminBot.getSystemMetrics());
        setSummary(adminBot.getSystemSummary());
        setAutoMode(adminBot.getAutoMode());
    };

    const handleAutoModeToggle = () => {
        const newMode = adminBot.toggleAutoMode();
        setAutoMode(newMode);
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-500/20 text-red-400';
            case 'high': return 'bg-orange-500/20 text-orange-400';
            case 'medium': return 'bg-yellow-500/20 text-yellow-400';
            case 'low': return 'bg-green-500/20 text-green-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-500/20 text-green-400';
            case 'in-progress': return 'bg-blue-500/20 text-blue-400';
            case 'failed': return 'bg-red-500/20 text-red-400';
            case 'pending': return 'bg-yellow-500/20 text-yellow-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-red-500/20 text-red-400';
            case 'high': return 'bg-orange-500/20 text-orange-400';
            case 'medium': return 'bg-yellow-500/20 text-yellow-400';
            case 'low': return 'bg-green-500/20 text-green-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    const getTrendColor = (trend: string) => {
        switch (trend) {
            case 'up': return 'text-green-400';
            case 'down': return 'text-red-400';
            case 'stable': return 'text-blue-400';
            default: return 'text-gray-400';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">👨‍💼 EHB Admin Robot</h1>
                        <p className="text-gray-300">System-wide administration and oversight</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <span className={`w-3 h-3 rounded-full ${autoMode ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            <span className="text-sm">{autoMode ? 'Auto Mode ON' : 'Auto Mode OFF'}</span>
                        </div>
                        <button
                            onClick={handleAutoModeToggle}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                autoMode
                                    ? 'bg-green-600 hover:bg-green-700'
                                    : 'bg-red-600 hover:bg-red-700'
                            }`}
                        >
                            {autoMode ? 'Disable Auto' : 'Enable Auto'}
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex space-x-1 mb-6 bg-white/10 rounded-lg p-1">
                    {[
                        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
                        { id: 'fraud', label: 'Fraud Alerts', icon: '🚨' },
                        { id: 'applications', label: 'Applications', icon: '📝' },
                        { id: 'violations', label: 'Violations', icon: '⚠️' },
                        { id: 'metrics', label: 'Metrics', icon: '📈' },
                        { id: 'tasks', label: 'Tasks', icon: '✅' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                                activeTab === tab.id
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-300 hover:text-white'
                            }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-6">
                        {/* System Summary */}
                        {summary && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
                                    <h3 className="text-lg font-semibold">💰 Total Revenue</h3>
                                    <p className="text-2xl font-bold">${summary.totalRevenue.toLocaleString()}</p>
                                    <p className="text-sm text-gray-300">System-wide</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
                                    <h3 className="text-lg font-semibold">👥 Active Users</h3>
                                    <p className="text-2xl font-bold">{summary.activeUsers.toLocaleString()}</p>
                                    <p className="text-sm text-gray-300">Total users</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
                                    <h3 className="text-lg font-semibold">🏢 Active Franchises</h3>
                                    <p className="text-2xl font-bold">{summary.activeFranchises}</p>
                                    <p className="text-sm text-gray-300">Total franchises</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
                                    <h3 className="text-lg font-semibold">⚡ System Uptime</h3>
                                    <p className="text-2xl font-bold">{summary.systemUptime}%</p>
                                    <p className="text-sm text-gray-300">Current uptime</p>
                                </div>
                            </div>
                        )}

                        {/* Robot Suggestions */}
                        {summary?.suggestions && summary.suggestions.length > 0 && (
                            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                                <h3 className="text-xl font-semibold mb-4">🤖 Robot Suggestions</h3>
                                <div className="space-y-2">
                                    {summary.suggestions.map((suggestion: string, index: number) => (
                                        <div key={index} className="flex items-center space-x-2">
                                            <span className="text-red-400">⚠️</span>
                                            <span>{suggestion}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* System Metrics */}
                        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                            <h3 className="text-xl font-semibold mb-4">📈 System Metrics</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {systemMetrics.map((metric, index) => (
                                    <div key={index} className="bg-white/5 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-semibold">{metric.name}</h4>
                                            <span className={`text-sm ${getTrendColor(metric.trend)}`}>
                                                {metric.trend === 'up' ? '↗' : metric.trend === 'down' ? '↘' : '→'}
                                            </span>
                                        </div>
                                        <p className="text-2xl font-bold">{metric.value}{metric.unit}</p>
                                        <p className="text-sm text-gray-300">
                                            {metric.change > 0 ? '+' : ''}{metric.change}% from last period
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Fraud Alerts Tab */}
                {activeTab === 'fraud' && (
                    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                        <h3 className="text-xl font-semibold mb-4">🚨 Fraud Alerts</h3>
                        <div className="space-y-4">
                            {fraudAlerts.map(alert => (
                                <div key={alert.id} className="border border-white/20 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-semibold">Alert #{alert.id}</h4>
                                        <div className="flex items-center space-x-2">
                                            <span className={`px-2 py-1 rounded-full text-xs ${getSeverityColor(alert.severity)}`}>
                                                {alert.severity}
                                            </span>
                                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(alert.status)}`}>
                                                {alert.status}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-300 mb-2">{alert.description}</p>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-400">Type</p>
                                            <p className="font-medium">{alert.type}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400">Affected Users</p>
                                            <p className="font-medium">{alert.affectedUsers}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400">Potential Loss</p>
                                            <p className="font-medium">${alert.potentialLoss}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Applications Tab */}
                {activeTab === 'applications' && (
                    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                        <h3 className="text-xl font-semibold mb-4">📝 Franchise Applications</h3>
                        <div className="space-y-4">
                            {franchiseApplications.map(application => (
                                <div key={application.id} className="border border-white/20 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-semibold">{application.name}</h4>
                                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(application.status)}`}>
                                            {application.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-300 mb-2">Location: {application.location}</p>
                                    <p className="text-sm text-gray-300 mb-2">Applicant: {application.applicant}</p>
                                    <p className="text-sm text-gray-300 mb-2">Investment: ${application.investment.toLocaleString()}</p>
                                    <div className="text-sm text-gray-400">
                                        <p>Documents: {application.documents.join(', ')}</p>
                                        <p>Submitted: {new Date(application.submittedAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Violations Tab */}
                {activeTab === 'violations' && (
                    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                        <h3 className="text-xl font-semibold mb-4">⚠️ Wallet Violations</h3>
                        <div className="space-y-4">
                            {walletViolations.map(violation => (
                                <div key={violation.id} className="border border-white/20 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-semibold">Violation #{violation.id}</h4>
                                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(violation.status)}`}>
                                            {violation.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-300 mb-2">User: {violation.userId}</p>
                                    <p className="text-sm text-gray-300 mb-2">Violation: {violation.violation}</p>
                                    <p className="text-sm text-gray-300 mb-2">Amount: ${violation.amount}</p>
                                    <p className="text-sm text-gray-300 mb-2">Description: {violation.description}</p>
                                    <p className="text-xs text-gray-400">Created: {new Date(violation.createdAt).toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Metrics Tab */}
                {activeTab === 'metrics' && (
                    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                        <h3 className="text-xl font-semibold mb-4">📈 System Metrics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {systemMetrics.map((metric, index) => (
                                <div key={index} className="bg-white/5 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-semibold">{metric.name}</h4>
                                        <span className={`text-sm ${getTrendColor(metric.trend)}`}>
                                            {metric.trend === 'up' ? '↗' : metric.trend === 'down' ? '↘' : '→'}
                                        </span>
                                    </div>
                                    <p className="text-2xl font-bold">{metric.value}{metric.unit}</p>
                                    <p className="text-sm text-gray-300">
                                        {metric.change > 0 ? '+' : ''}{metric.change}% from last period
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tasks Tab */}
                {activeTab === 'tasks' && (
                    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                        <h3 className="text-xl font-semibold mb-4">✅ Admin Tasks</h3>
                        <div className="space-y-3">
                            {tasks.map(task => (
                                <div key={task.id} className="border border-white/20 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-semibold">{task.title}</h4>
                                        <div className="flex items-center space-x-2">
                                            <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(task.priority)}`}>
                                                {task.priority}
                                            </span>
                                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(task.status)}`}>
                                                {task.status}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-300 mb-2">{task.description}</p>
                                    <p className="text-xs text-gray-400">Created: {new Date(task.createdAt).toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminBotComponent;
