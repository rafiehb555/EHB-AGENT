import React, { useState, useEffect } from 'react';

interface SellerTask {
    id: string;
    type: 'restock' | 'order' | 'inventory' | 'complaint' | 'pricing';
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
    createdAt: string;
    completedAt?: string;
    action?: string;
}

interface InventoryItem {
    id: string;
    name: string;
    currentStock: number;
    minStock: number;
    price: number;
    category: string;
    lastRestocked: string;
    supplier: string;
}

interface Order {
    id: string;
    customerName: string;
    items: Array<{
        productId: string;
        name: string;
        quantity: number;
        price: number;
    }>;
    total: number;
    status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
    createdAt: string;
    deliveryAddress: string;
    paymentStatus: 'pending' | 'paid' | 'failed';
}

interface Complaint {
    id: string;
    customerName: string;
    orderId: string;
    issue: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'investigating' | 'resolved' | 'escalated';
    createdAt: string;
    resolvedAt?: string;
}

class SellerBot {
    private tasks: SellerTask[] = [];
    private inventory: InventoryItem[] = [];
    private orders: Order[] = [];
    private complaints: Complaint[] = [];
    private autoMode: boolean = true;
    private sellerId: string;

    constructor(sellerId: string) {
        this.sellerId = sellerId;
        this.initializeData();
        this.startAutoMonitoring();
        console.log('🤖 Seller Bot initialized for seller:', sellerId);
    }

    private initializeData() {
        // Initialize inventory
        this.inventory = [
            {
                id: 'inv_1',
                name: 'Organic Bananas',
                currentStock: 15,
                minStock: 20,
                price: 2.99,
                category: 'Fruits',
                lastRestocked: new Date(Date.now() - 86400000).toISOString(),
                supplier: 'Fresh Farms Co.'
            },
            {
                id: 'inv_2',
                name: 'Whole Milk',
                currentStock: 8,
                minStock: 10,
                price: 3.49,
                category: 'Dairy',
                lastRestocked: new Date(Date.now() - 172800000).toISOString(),
                supplier: 'Dairy Delights'
            },
            {
                id: 'inv_3',
                name: 'Bread Loaf',
                currentStock: 25,
                minStock: 15,
                price: 2.29,
                category: 'Bakery',
                lastRestocked: new Date(Date.now() - 43200000).toISOString(),
                supplier: 'Bakery Fresh'
            }
        ];

        // Initialize orders
        this.orders = [
            {
                id: 'ord_1',
                customerName: 'John Smith',
                items: [
                    { productId: 'inv_1', name: 'Organic Bananas', quantity: 2, price: 2.99 },
                    { productId: 'inv_2', name: 'Whole Milk', quantity: 1, price: 3.49 }
                ],
                total: 9.47,
                status: 'pending',
                createdAt: new Date().toISOString(),
                deliveryAddress: '123 Main St, City',
                paymentStatus: 'paid'
            },
            {
                id: 'ord_2',
                customerName: 'Sarah Johnson',
                items: [
                    { productId: 'inv_3', name: 'Bread Loaf', quantity: 1, price: 2.29 }
                ],
                total: 2.29,
                status: 'confirmed',
                createdAt: new Date(Date.now() - 3600000).toISOString(),
                deliveryAddress: '456 Oak Ave, City',
                paymentStatus: 'paid'
            }
        ];

        // Initialize complaints
        this.complaints = [
            {
                id: 'comp_1',
                customerName: 'Mike Wilson',
                orderId: 'ord_1',
                issue: 'Milk was expired',
                severity: 'high',
                status: 'open',
                createdAt: new Date(Date.now() - 7200000).toISOString()
            }
        ];
    }

    private startAutoMonitoring() {
        // Check inventory every 30 minutes
        setInterval(() => {
            this.checkInventory();
        }, 1800000);

        // Check orders every 15 minutes
        setInterval(() => {
            this.checkOrders();
        }, 900000);

        // Check complaints every hour
        setInterval(() => {
            this.checkComplaints();
        }, 3600000);
    }

    // Check inventory levels and create restock tasks
    private checkInventory() {
        const lowStockItems = this.inventory.filter(item => item.currentStock <= item.minStock);

        lowStockItems.forEach(item => {
            const existingTask = this.tasks.find(task =>
                task.type === 'restock' && task.description.includes(item.name)
            );

            if (!existingTask) {
                this.createTask('restock', `Restock ${item.name}`,
                    `${item.name} is low on stock (${item.currentStock}/${item.minStock}). Auto-order placed.`,
                    'high');
            }
        });
    }

    // Check pending orders and auto-confirm if possible
    private checkOrders() {
        const pendingOrders = this.orders.filter(order => order.status === 'pending');

        pendingOrders.forEach(order => {
            const canFulfill = order.items.every(item => {
                const inventoryItem = this.inventory.find(inv => inv.id === item.productId);
                return inventoryItem && inventoryItem.currentStock >= item.quantity;
            });

            if (canFulfill && order.paymentStatus === 'paid') {
                this.autoConfirmOrder(order.id);
            }
        });
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

    // Create a new task
    private createTask(type: SellerTask['type'], title: string, description: string, priority: SellerTask['priority'] = 'medium') {
        const task: SellerTask = {
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

    // Auto-confirm order
    private autoConfirmOrder(orderId: string) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            order.status = 'confirmed';

            // Update inventory
            order.items.forEach(item => {
                const inventoryItem = this.inventory.find(inv => inv.id === item.productId);
                if (inventoryItem) {
                    inventoryItem.currentStock -= item.quantity;
                }
            });

            this.createTask('order', `Order ${orderId} Confirmed`,
                `Order for ${order.customerName} has been automatically confirmed and is ready for shipping.`,
                'medium');
        }
    }

    // Escalate complaint
    private escalateComplaint(complaintId: string) {
        const complaint = this.complaints.find(c => c.id === complaintId);
        if (complaint) {
            complaint.status = 'escalated';

            this.createTask('complaint', `Complaint Escalated`,
                `Complaint from ${complaint.customerName} has been escalated due to high severity and time delay.`,
                'urgent');
        }
    }

    // Get daily summary
    getDailySummary(): {
        totalOrders: number;
        pendingOrders: number;
        lowStockItems: number;
        openComplaints: number;
        revenue: number;
        suggestions: string[];
    } {
        const today = new Date().toDateString();
        const todayOrders = this.orders.filter(order =>
            new Date(order.createdAt).toDateString() === today
        );

        const revenue = todayOrders.reduce((sum, order) => sum + order.total, 0);
        const lowStockItems = this.inventory.filter(item => item.currentStock <= item.minStock).length;
        const openComplaints = this.complaints.filter(comp => comp.status === 'open').length;

        const suggestions = [];
        if (lowStockItems > 0) {
            suggestions.push(`${lowStockItems} items need restocking`);
        }
        if (pendingOrders.length > 0) {
            suggestions.push(`${pendingOrders.length} orders pending confirmation`);
        }
        if (openComplaints > 0) {
            suggestions.push(`${openComplaints} complaints need attention`);
        }

        return {
            totalOrders: todayOrders.length,
            pendingOrders: this.orders.filter(o => o.status === 'pending').length,
            lowStockItems,
            openComplaints,
            revenue,
            suggestions
        };
    }

    // Get all tasks
    getTasks(): SellerTask[] {
        return this.tasks;
    }

    // Get inventory
    getInventory(): InventoryItem[] {
        return this.inventory;
    }

    // Get orders
    getOrders(): Order[] {
        return this.orders;
    }

    // Get complaints
    getComplaints(): Complaint[] {
        return this.complaints;
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

// React Component for Seller Bot
const SellerBotComponent: React.FC = () => {
    const [sellerBot] = useState(() => new SellerBot('seller_123'));
    const [tasks, setTasks] = useState<SellerTask[]>([]);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [autoMode, setAutoMode] = useState(true);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'orders' | 'complaints' | 'tasks'>('dashboard');

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const loadData = () => {
        setTasks(sellerBot.getTasks());
        setInventory(sellerBot.getInventory());
        setOrders(sellerBot.getOrders());
        setComplaints(sellerBot.getComplaints());
        setSummary(sellerBot.getDailySummary());
        setAutoMode(sellerBot.getAutoMode());
    };

    const handleAutoModeToggle = () => {
        const newMode = sellerBot.toggleAutoMode();
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">🤖 EHB Seller Robot</h1>
                        <p className="text-gray-300">Automated seller assistant</p>
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
                        { id: 'inventory', label: 'Inventory', icon: '📦' },
                        { id: 'orders', label: 'Orders', icon: '🛒' },
                        { id: 'complaints', label: 'Complaints', icon: '⚠️' },
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
                                    <h3 className="text-lg font-semibold">📦 Total Orders</h3>
                                    <p className="text-2xl font-bold">{summary.totalOrders}</p>
                                    <p className="text-sm text-gray-300">Today</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
                                    <h3 className="text-lg font-semibold">⏳ Pending Orders</h3>
                                    <p className="text-2xl font-bold">{summary.pendingOrders}</p>
                                    <p className="text-sm text-gray-300">Need attention</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
                                    <h3 className="text-lg font-semibold">📉 Low Stock</h3>
                                    <p className="text-2xl font-bold">{summary.lowStockItems}</p>
                                    <p className="text-sm text-gray-300">Items need restocking</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
                                    <h3 className="text-lg font-semibold">💰 Revenue</h3>
                                    <p className="text-2xl font-bold">${summary.revenue.toFixed(2)}</p>
                                    <p className="text-sm text-gray-300">Today</p>
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

                        {/* Recent Activity */}
                        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                            <h3 className="text-xl font-semibold mb-4">📋 Recent Activity</h3>
                            <div className="space-y-3">
                                {tasks.slice(0, 5).map(task => (
                                    <div key={task.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                        <div>
                                            <h4 className="font-medium">{task.title}</h4>
                                            <p className="text-sm text-gray-300">{task.description}</p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(task.priority)}`}>
                                                {task.priority}
                                            </span>
                                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(task.status)}`}>
                                                {task.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Inventory Tab */}
                {activeTab === 'inventory' && (
                    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                        <h3 className="text-xl font-semibold mb-4">📦 Inventory Management</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/20">
                                        <th className="text-left py-2">Product</th>
                                        <th className="text-left py-2">Stock</th>
                                        <th className="text-left py-2">Min Stock</th>
                                        <th className="text-left py-2">Price</th>
                                        <th className="text-left py-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inventory.map(item => (
                                        <tr key={item.id} className="border-b border-white/10">
                                            <td className="py-2">{item.name}</td>
                                            <td className="py-2">{item.currentStock}</td>
                                            <td className="py-2">{item.minStock}</td>
                                            <td className="py-2">${item.price}</td>
                                            <td className="py-2">
                                                <span className={`px-2 py-1 rounded-full text-xs ${
                                                    item.currentStock <= item.minStock
                                                        ? 'bg-red-500/20 text-red-400'
                                                        : 'bg-green-500/20 text-green-400'
                                                }`}>
                                                    {item.currentStock <= item.minStock ? 'Low Stock' : 'In Stock'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Orders Tab */}
                {activeTab === 'orders' && (
                    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                        <h3 className="text-xl font-semibold mb-4">🛒 Orders</h3>
                        <div className="space-y-4">
                            {orders.map(order => (
                                <div key={order.id} className="border border-white/20 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-semibold">Order #{order.id}</h4>
                                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-300 mb-2">Customer: {order.customerName}</p>
                                    <p className="text-sm text-gray-300 mb-2">Total: ${order.total}</p>
                                    <div className="text-sm text-gray-400">
                                        {order.items.map(item => (
                                            <div key={item.productId}>{item.quantity}x {item.name}</div>
                                        ))}
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
                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                            complaint.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                                            complaint.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                                            'bg-yellow-500/20 text-yellow-400'
                                        }`}>
                                            {complaint.severity}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-300 mb-2">Customer: {complaint.customerName}</p>
                                    <p className="text-sm text-gray-300 mb-2">Issue: {complaint.issue}</p>
                                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(complaint.status)}`}>
                                        {complaint.status}
                                    </span>
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

export default SellerBotComponent;
