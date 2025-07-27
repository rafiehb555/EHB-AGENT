import React, { useState, useEffect } from 'react';

interface FranchiseTask {
    id: string;
    type: 'complaint' | 'performance' | 'revenue' | 'staff' | 'fine';
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
    createdAt: string;
    completedAt?: string;
    area?: string;
    amount?: number;
}

interface SubFranchise {
    id: string;
    name: string;
    area: string;
    manager: string;
    performance: {
        orders: number;
        revenue: number;
        complaints: number;
        deliveryTime: number; // minutes
        rating: number; // 1-5
    };
    status: 'active' | 'suspended' | 'pending';
    lastReport: string;
}

interface Complaint {
    id: string;
    customerName: string;
    subFranchiseId: string;
    issue: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'investigating' | 'resolved' | 'escalated';
    createdAt: string;
    resolvedAt?: string;
    hoursOpen: number;
}

interface Fine {
    id: string;
    subFranchiseId: string;
    reason: string;
    amount: number;
    status: 'pending' | 'applied' | 'paid' | 'disputed';
    createdAt: string;
    dueDate: string;
}

interface RevenueReport {
    date: string;
    totalRevenue: number;
    orders: number;
    averageOrderValue: number;
    topAreas: Array<{
        area: string;
        revenue: number;
        orders: number;
    }>;
}

class FranchiseBot {
    private tasks: FranchiseTask[] = [];
    private subFranchises: SubFranchise[] = [];
    private complaints: Complaint[] = [];
    private fines: Fine[] = [];
    private revenueReports: RevenueReport[] = [];
    private autoMode: boolean = true;
    private franchiseId: string;

    constructor(franchiseId: string) {
        this.franchiseId = franchiseId;
        this.initializeData();
        this.startAutoMonitoring();
        console.log('🏪 Franchise Bot initialized for franchise:', franchiseId);
    }

    private initializeData() {
        // Initialize sub-franchises
        this.subFranchises = [
            {
                id: 'sub_1',
                name: 'Downtown Branch',
                area: 'Downtown',
                manager: 'Ahmed Khan',
                performance: {
                    orders: 45,
                    revenue: 1250,
                    complaints: 2,
                    deliveryTime: 35,
                    rating: 4.2
                },
                status: 'active',
                lastReport: new Date().toISOString()
            },
            {
                id: 'sub_2',
                name: 'Mall Branch',
                area: 'Shopping Mall',
                manager: 'Sarah Ahmed',
                performance: {
                    orders: 38,
                    revenue: 980,
                    complaints: 1,
                    deliveryTime: 28,
                    rating: 4.5
                },
                status: 'active',
                lastReport: new Date().toISOString()
            },
            {
                id: 'sub_3',
                name: 'University Branch',
                area: 'University Area',
                manager: 'Ali Hassan',
                performance: {
                    orders: 52,
                    revenue: 1400,
                    complaints: 3,
                    deliveryTime: 42,
                    rating: 3.8
                },
                status: 'active',
                lastReport: new Date().toISOString()
            }
        ];

        // Initialize complaints
        this.complaints = [
            {
                id: 'comp_1',
                customerName: 'Fatima Ali',
                subFranchiseId: 'sub_1',
                issue: 'Late delivery - order was 45 minutes late',
                severity: 'high',
                status: 'open',
                createdAt: new Date(Date.now() - 25200000).toISOString(), // 7 hours ago
                hoursOpen: 7
            },
            {
                id: 'comp_2',
                customerName: 'Omar Khan',
                subFranchiseId: 'sub_3',
                issue: 'Wrong items in order',
                severity: 'medium',
                status: 'investigating',
                createdAt: new Date(Date.now() - 18000000).toISOString(), // 5 hours ago
                hoursOpen: 5
            }
        ];

        // Initialize fines
        this.fines = [
            {
                id: 'fine_1',
                subFranchiseId: 'sub_3',
                reason: 'Missed 2 deliveries in 24 hours',
                amount: 50,
                status: 'pending',
                createdAt: new Date().toISOString(),
                dueDate: new Date(Date.now() + 86400000).toISOString() // 24 hours
            }
        ];

        // Initialize revenue reports
        this.revenueReports = [
            {
                date: new Date().toISOString().split('T')[0],
                totalRevenue: 3630,
                orders: 135,
                averageOrderValue: 26.89,
                topAreas: [
                    { area: 'University Area', revenue: 1400, orders: 52 },
                    { area: 'Downtown', revenue: 1250, orders: 45 },
                    { area: 'Shopping Mall', revenue: 980, orders: 38 }
                ]
            }
        ];
    }

    private startAutoMonitoring() {
        // Check complaints every hour
        setInterval(() => {
            this.checkComplaints();
        }, 3600000);

        // Check performance daily
        setInterval(() => {
            this.checkPerformance();
        }, 86400000);

        // Generate reports weekly
        setInterval(() => {
            this.generateWeeklyReport();
        }, 604800000);
    }

    // Check complaints and escalate if needed
    private checkComplaints() {
        const openComplaints = this.complaints.filter(comp => comp.status === 'open');
        const sixHoursAgo = new Date(Date.now() - 21600000);

        openComplaints.forEach(complaint => {
            const complaintTime = new Date(complaint.createdAt);
            if (complaintTime < sixHoursAgo && complaint.severity === 'high') {
                this.escalateComplaint(complaint.id);
            }
        });
    }

    // Check sub-franchise performance
    private checkPerformance() {
        this.subFranchises.forEach(subFranchise => {
            // Check delivery time violations
            if (subFranchise.performance.deliveryTime > 40) {
                this.createTask('performance', `High Delivery Time Alert`,
                    `${subFranchise.name} has average delivery time of ${subFranchise.performance.deliveryTime} minutes. Consider optimization.`,
                    'high', subFranchise.area);
            }

            // Check low rating
            if (subFranchise.performance.rating < 4.0) {
                this.createTask('performance', `Low Rating Alert`,
                    `${subFranchise.name} has rating of ${subFranchise.performance.rating}/5. Needs improvement.`,
                    'medium', subFranchise.area);
            }

            // Check high complaints
            if (subFranchise.performance.complaints > 2) {
                this.createTask('complaint', `High Complaints Alert`,
                    `${subFranchise.name} has ${subFranchise.performance.complaints} complaints. Consider investigation.`,
                    'high', subFranchise.area);
            }
        });
    }

    // Generate weekly report
    private generateWeeklyReport() {
        const totalRevenue = this.subFranchises.reduce((sum, sub) => sum + sub.performance.revenue, 0);
        const totalOrders = this.subFranchises.reduce((sum, sub) => sum + sub.performance.orders, 0);
        const totalComplaints = this.complaints.filter(comp => comp.status === 'open').length;

        this.createTask('revenue', `Weekly Report Generated`,
            `Weekly summary: $${totalRevenue} revenue, ${totalOrders} orders, ${totalComplaints} open complaints.`,
            'medium');
    }

    // Create a new task
    private createTask(type: FranchiseTask['type'], title: string, description: string, priority: FranchiseTask['priority'] = 'medium', area?: string) {
        const task: FranchiseTask = {
            id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            title,
            description,
            priority,
            status: 'pending',
            createdAt: new Date().toISOString(),
            area
        };

        this.tasks.push(task);
        return task;
    }

    // Escalate complaint
    private escalateComplaint(complaintId: string) {
        const complaint = this.complaints.find(c => c.id === complaintId);
        if (complaint) {
            complaint.status = 'escalated';

            this.createTask('complaint', `Complaint Escalated`,
                `Complaint from ${complaint.customerName} has been escalated due to high severity and time delay.`,
                'urgent', complaint.subFranchiseId);
        }
    }

    // Apply fine to sub-franchise
    applyFine(subFranchiseId: string, reason: string, amount: number) {
        const fine: Fine = {
            id: `fine_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            subFranchiseId,
            reason,
            amount,
            status: 'pending',
            createdAt: new Date().toISOString(),
            dueDate: new Date(Date.now() + 86400000).toISOString() // 24 hours
        };

        this.fines.push(fine);

        this.createTask('fine', `Fine Applied`,
            `Fine of $${amount} applied to sub-franchise for: ${reason}`,
            'high');
    }

    // Get daily summary
    getDailySummary(): {
        totalRevenue: number;
        totalOrders: number;
        activeSubFranchises: number;
        openComplaints: number;
        pendingFines: number;
        suggestions: string[];
    } {
        const totalRevenue = this.subFranchises.reduce((sum, sub) => sum + sub.performance.revenue, 0);
        const totalOrders = this.subFranchises.reduce((sum, sub) => sum + sub.performance.orders, 0);
        const activeSubFranchises = this.subFranchises.filter(sub => sub.status === 'active').length;
        const openComplaints = this.complaints.filter(comp => comp.status === 'open').length;
        const pendingFines = this.fines.filter(fine => fine.status === 'pending').length;

        const suggestions = [];
        if (openComplaints > 0) {
            suggestions.push(`${openComplaints} complaints unresolved – escalate to master franchise?`);
        }
        if (pendingFines > 0) {
            suggestions.push(`${pendingFines} fines pending collection`);
        }
        if (totalRevenue > 0) {
            suggestions.push(`You earned $${totalRevenue} yesterday. Submit report to HQ?`);
        }

        return {
            totalRevenue,
            totalOrders,
            activeSubFranchises,
            openComplaints,
            pendingFines,
            suggestions
        };
    }

    // Get all tasks
    getTasks(): FranchiseTask[] {
        return this.tasks;
    }

    // Get sub-franchises
    getSubFranchises(): SubFranchise[] {
        return this.subFranchises;
    }

    // Get complaints
    getComplaints(): Complaint[] {
        return this.complaints;
    }

    // Get fines
    getFines(): Fine[] {
        return this.fines;
    }

    // Get revenue reports
    getRevenueReports(): RevenueReport[] {
        return this.revenueReports;
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

// React Component for Franchise Bot
const FranchiseBotComponent: React.FC = () => {
    const [franchiseBot] = useState(() => new FranchiseBot('franchise_123'));
    const [tasks, setTasks] = useState<FranchiseTask[]>([]);
    const [subFranchises, setSubFranchises] = useState<SubFranchise[]>([]);
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [fines, setFines] = useState<Fine[]>([]);
    const [revenueReports, setRevenueReports] = useState<RevenueReport[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [autoMode, setAutoMode] = useState(true);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'subfranchises' | 'complaints' | 'fines' | 'reports' | 'tasks'>('dashboard');

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const loadData = () => {
        setTasks(franchiseBot.getTasks());
        setSubFranchises(franchiseBot.getSubFranchises());
        setComplaints(franchiseBot.getComplaints());
        setFines(franchiseBot.getFines());
        setRevenueReports(franchiseBot.getRevenueReports());
        setSummary(franchiseBot.getDailySummary());
        setAutoMode(franchiseBot.getAutoMode());
    };

    const handleAutoModeToggle = () => {
        const newMode = franchiseBot.toggleAutoMode();
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">🏪 EHB Franchise Robot</h1>
                        <p className="text-gray-300">District Lahore - Automated franchise management</p>
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
                        { id: 'subfranchises', label: 'Sub-Franchises', icon: '🏢' },
                        { id: 'complaints', label: 'Complaints', icon: '⚠️' },
                        { id: 'fines', label: 'Fines', icon: '💰' },
                        { id: 'reports', label: 'Reports', icon: '📈' },
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
                        {/* Daily Summary */}
                        {summary && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
                                    <h3 className="text-lg font-semibold">💰 Total Revenue</h3>
                                    <p className="text-2xl font-bold">${summary.totalRevenue}</p>
                                    <p className="text-sm text-gray-300">Today</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
                                    <h3 className="text-lg font-semibold">🛒 Total Orders</h3>
                                    <p className="text-2xl font-bold">{summary.totalOrders}</p>
                                    <p className="text-sm text-gray-300">Today</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
                                    <h3 className="text-lg font-semibold">🏢 Active Branches</h3>
                                    <p className="text-2xl font-bold">{summary.activeSubFranchises}</p>
                                    <p className="text-sm text-gray-300">Sub-franchises</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
                                    <h3 className="text-lg font-semibold">⚠️ Open Complaints</h3>
                                    <p className="text-2xl font-bold">{summary.openComplaints}</p>
                                    <p className="text-sm text-gray-300">Need attention</p>
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
                                            <span className="text-green-400">✅</span>
                                            <span>{suggestion}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Top Performing Areas */}
                        {revenueReports.length > 0 && (
                            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                                <h3 className="text-xl font-semibold mb-4">🏆 Top Performing Areas</h3>
                                <div className="space-y-3">
                                    {revenueReports[0].topAreas.map((area, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                            <div>
                                                <h4 className="font-medium">{area.area}</h4>
                                                <p className="text-sm text-gray-300">{area.orders} orders</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold">${area.revenue}</p>
                                                <p className="text-sm text-gray-300">Revenue</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Sub-Franchises Tab */}
                {activeTab === 'subfranchises' && (
                    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                        <h3 className="text-xl font-semibold mb-4">🏢 Sub-Franchises</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {subFranchises.map(subFranchise => (
                                <div key={subFranchise.id} className="border border-white/20 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-semibold">{subFranchise.name}</h4>
                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                            subFranchise.status === 'active' ? 'bg-green-500/20 text-green-400' :
                                            subFranchise.status === 'suspended' ? 'bg-red-500/20 text-red-400' :
                                            'bg-yellow-500/20 text-yellow-400'
                                        }`}>
                                            {subFranchise.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-300 mb-2">Manager: {subFranchise.manager}</p>
                                    <p className="text-sm text-gray-300 mb-2">Area: {subFranchise.area}</p>
                                    <div className="space-y-1 text-sm">
                                        <div>Orders: {subFranchise.performance.orders}</div>
                                        <div>Revenue: ${subFranchise.performance.revenue}</div>
                                        <div>Complaints: {subFranchise.performance.complaints}</div>
                                        <div>Delivery Time: {subFranchise.performance.deliveryTime} min</div>
                                        <div>Rating: {subFranchise.performance.rating}/5</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Complaints Tab */}
                {activeTab === 'complaints' && (
                    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                        <h3 className="text-xl font-semibold mb-4">⚠️ Complaints</h3>
                        <div className="space-y-4">
                            {complaints.map(complaint => (
                                <div key={complaint.id} className="border border-white/20 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-semibold">Complaint #{complaint.id}</h4>
                                        <div className="flex items-center space-x-2">
                                            <span className={`px-2 py-1 rounded-full text-xs ${getSeverityColor(complaint.severity)}`}>
                                                {complaint.severity}
                                            </span>
                                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(complaint.status)}`}>
                                                {complaint.status}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-300 mb-2">Customer: {complaint.customerName}</p>
                                    <p className="text-sm text-gray-300 mb-2">Issue: {complaint.issue}</p>
                                    <p className="text-sm text-gray-300 mb-2">Hours Open: {complaint.hoursOpen}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Fines Tab */}
                {activeTab === 'fines' && (
                    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                        <h3 className="text-xl font-semibold mb-4">💰 Fines</h3>
                        <div className="space-y-4">
                            {fines.map(fine => (
                                <div key={fine.id} className="border border-white/20 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-semibold">Fine #{fine.id}</h4>
                                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(fine.status)}`}>
                                            {fine.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-300 mb-2">Reason: {fine.reason}</p>
                                    <p className="text-sm text-gray-300 mb-2">Amount: ${fine.amount}</p>
                                    <p className="text-sm text-gray-300 mb-2">Due: {new Date(fine.dueDate).toLocaleDateString()}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Reports Tab */}
                {activeTab === 'reports' && (
                    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                        <h3 className="text-xl font-semibold mb-4">📈 Revenue Reports</h3>
                        <div className="space-y-4">
                            {revenueReports.map((report, index) => (
                                <div key={index} className="border border-white/20 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-semibold">Report for {report.date}</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-300">Total Revenue</p>
                                            <p className="font-semibold">${report.totalRevenue}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-300">Total Orders</p>
                                            <p className="font-semibold">{report.orders}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-300">Average Order Value</p>
                                            <p className="font-semibold">${report.averageOrderValue.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tasks Tab */}
                {activeTab === 'tasks' && (
                    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                        <h3 className="text-xl font-semibold mb-4">✅ Tasks</h3>
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
                                    {task.area && (
                                        <p className="text-sm text-gray-400 mb-2">Area: {task.area}</p>
                                    )}
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

export default FranchiseBotComponent;
