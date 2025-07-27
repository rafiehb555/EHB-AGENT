import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface RobotAction {
    id: string;
    actionType: string;
    data: any;
    timestamp: string;
    hash: string;
    blockchainTxId?: string;
    verified: boolean;
    status: 'pending' | 'completed' | 'failed';
    outcome: string;
}

interface FilterOptions {
    type: 'all' | 'orders' | 'services' | 'failed' | 'verified';
    dateRange: 'all' | 'today' | 'week' | 'month';
    search: string;
}

const RobotLogPage: React.FC = () => {
    const [actions, setActions] = useState<RobotAction[]>([]);
    const [filteredActions, setFilteredActions] = useState<RobotAction[]>([]);
    const [filters, setFilters] = useState<FilterOptions>({
        type: 'all',
        dateRange: 'all',
        search: ''
    });
    const [loading, setLoading] = useState(true);
    const [walletAddress, setWalletAddress] = useState('');
    const [validatorStatus, setValidatorStatus] = useState<any>(null);

    useEffect(() => {
        loadRobotActions();
        loadValidatorStatus();
    }, []);

    useEffect(() => {
        filterActions();
    }, [actions, filters]);

    const loadRobotActions = async () => {
        try {
            setLoading(true);
            // Mock robot actions data
            const mockActions: RobotAction[] = [
                {
                    id: '1',
                    actionType: 'appointment_booked',
                    data: { service: 'VIP Consultation', date: '2025-07-28', time: '14:00' },
                    timestamp: '2025-07-27T10:30:00Z',
                    hash: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
                    blockchainTxId: '0x1234567890ABCDEF1234567890ABCDEF12345678',
                    verified: true,
                    status: 'completed',
                    outcome: 'Appointment successfully booked'
                },
                {
                    id: '2',
                    actionType: 'validator_stake',
                    data: { amount: '1000', token: 'EHBGC' },
                    timestamp: '2025-07-27T09:15:00Z',
                    hash: '0xBCDEF1234567890ABCDEF1234567890ABCDEF123',
                    blockchainTxId: '0x234567890ABCDEF1234567890ABCDEF123456789',
                    verified: true,
                    status: 'completed',
                    outcome: 'Successfully staked 1000 EHBGC'
                },
                {
                    id: '3',
                    actionType: 'rewards_claimed',
                    data: { amount: '50', token: 'EHBGC' },
                    timestamp: '2025-07-27T08:45:00Z',
                    hash: '0xCDEF1234567890ABCDEF1234567890ABCDEF1234',
                    verified: true,
                    status: 'completed',
                    outcome: 'Claimed 50 EHBGC rewards'
                },
                {
                    id: '4',
                    actionType: 'payment_processed',
                    data: { amount: '200', currency: 'USD', service: 'Premium Service' },
                    timestamp: '2025-07-26T16:20:00Z',
                    hash: '0xDEF1234567890ABCDEF1234567890ABCDEF12345',
                    verified: false,
                    status: 'pending',
                    outcome: 'Payment processing...'
                },
                {
                    id: '5',
                    actionType: 'auto_stake',
                    data: { amount: '100', frequency: 'weekly' },
                    timestamp: '2025-07-26T12:00:00Z',
                    hash: '0xEF1234567890ABCDEF1234567890ABCDEF123456',
                    verified: true,
                    status: 'completed',
                    outcome: 'Auto-stake configured for weekly frequency'
                }
            ];

            setActions(mockActions);
        } catch (error) {
            console.error('Failed to load robot actions:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadValidatorStatus = async () => {
        try {
            // Mock validator status
            setValidatorStatus({
                isValidator: true,
                rank: 21,
                totalValidators: 450,
                stakedAmount: '2500',
                uptime: 99.8,
                rewards: '125'
            });
        } catch (error) {
            console.error('Failed to load validator status:', error);
        }
    };

    const filterActions = () => {
        let filtered = [...actions];

        // Filter by type
        if (filters.type !== 'all') {
            filtered = filtered.filter(action => {
                switch (filters.type) {
                    case 'orders':
                        return action.actionType.includes('order') || action.actionType.includes('payment');
                    case 'services':
                        return action.actionType.includes('service') || action.actionType.includes('appointment');
                    case 'failed':
                        return action.status === 'failed';
                    case 'verified':
                        return action.verified;
                    default:
                        return true;
                }
            });
        }

        // Filter by date range
        if (filters.dateRange !== 'all') {
            const now = new Date();
            let cutoff: Date;

            switch (filters.dateRange) {
                case 'today':
                    cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                    break;
                case 'week':
                    cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    cutoff = new Date(0);
            }

            filtered = filtered.filter(action => new Date(action.timestamp) >= cutoff);
        }

        // Filter by search
        if (filters.search) {
            filtered = filtered.filter(action =>
                action.actionType.toLowerCase().includes(filters.search.toLowerCase()) ||
                action.outcome.toLowerCase().includes(filters.search.toLowerCase()) ||
                action.hash.toLowerCase().includes(filters.search.toLowerCase())
            );
        }

        setFilteredActions(filtered);
    };

    const getActionIcon = (actionType: string): string => {
        const icons: { [key: string]: string } = {
            appointment_booked: '📅',
            validator_stake: '🔒',
            rewards_claimed: '💰',
            payment_processed: '💳',
            auto_stake: '🤖',
            vip_service: '👑',
            marketplace_order: '🛒',
            portfolio_rebalance: '📊'
        };
        return icons[actionType] || '⚡';
    };

    const getStatusColor = (status: string): string => {
        switch (status) {
            case 'completed':
                return 'text-green-500';
            case 'pending':
                return 'text-yellow-500';
            case 'failed':
                return 'text-red-500';
            default:
                return 'text-gray-500';
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Show toast notification
        alert('Copied to clipboard!');
    };

    const verifyAction = async (hash: string) => {
        try {
            // Mock verification
            const verified = Math.random() > 0.1; // 90% success rate
            alert(verified ? '✅ Action verified on blockchain!' : '❌ Action verification failed');
        } catch (error) {
            console.error('Verification error:', error);
            alert('❌ Failed to verify action');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-4">🤖 EHB Robot Activity Log</h1>
                    <p className="text-gray-300">Track all robot actions with blockchain verification</p>
                </div>

                {/* Validator Status */}
                {validatorStatus && (
                    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 mb-8">
                        <h2 className="text-2xl font-semibold mb-4">Validator Status</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-green-400">#{validatorStatus.rank}</div>
                                <div className="text-sm text-gray-300">Rank</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-blue-400">{validatorStatus.totalValidators}</div>
                                <div className="text-sm text-gray-300">Total Validators</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-purple-400">{validatorStatus.stakedAmount}</div>
                                <div className="text-sm text-gray-300">Staked (EHBGC)</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-yellow-400">{validatorStatus.rewards}</div>
                                <div className="text-sm text-gray-300">Rewards (EHBGC)</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 mb-8">
                    <h3 className="text-xl font-semibold mb-4">Filters</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Action Type</label>
                            <select
                                value={filters.type}
                                onChange={(e) => setFilters({ ...filters, type: e.target.value as any })}
                                className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white"
                            >
                                <option value="all">All Actions</option>
                                <option value="orders">Orders & Payments</option>
                                <option value="services">Services</option>
                                <option value="failed">Failed Actions</option>
                                <option value="verified">Verified Actions</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Date Range</label>
                            <select
                                value={filters.dateRange}
                                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value as any })}
                                className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white"
                            >
                                <option value="all">All Time</option>
                                <option value="today">Today</option>
                                <option value="week">This Week</option>
                                <option value="month">This Month</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Search</label>
                            <input
                                type="text"
                                placeholder="Search actions..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={() => setFilters({ type: 'all', dateRange: 'all', search: '' })}
                                className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg px-4 py-2 font-medium transition-colors"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Actions List */}
                <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-semibold">Robot Actions ({filteredActions.length})</h3>
                        <div className="text-sm text-gray-300">
                            Showing {filteredActions.length} of {actions.length} actions
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                            <p className="mt-4 text-gray-300">Loading robot actions...</p>
                        </div>
                    ) : filteredActions.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-300">No actions found matching your filters.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredActions.map((action) => (
                                <div
                                    key={action.id}
                                    className="bg-white/5 backdrop-blur-lg rounded-lg p-4 border border-white/10 hover:border-white/20 transition-all"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start space-x-4">
                                            <div className="text-2xl">{getActionIcon(action.actionType)}</div>
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <h4 className="font-semibold capitalize">
                                                        {action.actionType.replace(/_/g, ' ')}
                                                    </h4>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(action.status)}`}>
                                                        {action.status}
                                                    </span>
                                                    {action.verified && (
                                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                                                            ✅ Verified
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-gray-300 text-sm mb-2">{action.outcome}</p>
                                                <div className="text-xs text-gray-400">
                                                    {new Date(action.timestamp).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => copyToClipboard(action.hash)}
                                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs transition-colors"
                                            >
                                                Copy Hash
                                            </button>
                                            <button
                                                onClick={() => verifyAction(action.hash)}
                                                className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs transition-colors"
                                            >
                                                Verify
                                            </button>
                                        </div>
                                    </div>

                                    {/* Action Details */}
                                    <div className="mt-4 pt-4 border-t border-white/10">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-400">Hash:</span>
                                                <div className="font-mono text-xs bg-black/20 rounded p-2 mt-1 break-all">
                                                    {action.hash}
                                                </div>
                                            </div>
                                            {action.blockchainTxId && (
                                                <div>
                                                    <span className="text-gray-400">Transaction ID:</span>
                                                    <div className="font-mono text-xs bg-black/20 rounded p-2 mt-1 break-all">
                                                        {action.blockchainTxId}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RobotLogPage;
