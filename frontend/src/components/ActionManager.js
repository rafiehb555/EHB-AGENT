import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiZap, FiShoppingCart, FiCreditCard, FiDatabase, FiGlobe, FiFile, FiTerminal, FiBell, FiPlay, FiEdit, FiTrash2, FiCheck, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ActionManager = ({ onActionCreate, onActionUpdate, onActionDelete }) => {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAction, setEditingAction] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'order',
    priority: 'medium',
    requiresConfirmation: false,
    order: {
      productName: '',
      quantity: 1,
      price: 0,
      vendor: '',
      deliveryAddress: '',
      paymentMethod: ''
    },
    payment: {
      amount: 0,
      currency: 'INR',
      method: '',
      recipient: '',
      description: ''
    },
    database: {
      operation: 'query',
      table: '',
      query: '',
      data: {}
    },
    api: {
      url: '',
      method: 'GET',
      headers: {},
      body: {},
      timeout: 5000
    },
    notification: {
      type: 'email',
      recipient: '',
      subject: '',
      message: '',
      template: 'default'
    }
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Load actions on component mount
  useEffect(() => {
    loadActions();
  }, []);

  const loadActions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/actions`, {
        headers: {
          'Content-Type': 'application/json',
          'user-id': 'default-user'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setActions(data.actions || []);
      } else {
        throw new Error('Failed to load actions');
      }
    } catch (error) {
      console.error('Error loading actions:', error);
      toast.error('Failed to load actions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const actionData = {
        ...formData,
        scheduledFor: new Date().toISOString()
      };

      const response = await fetch(`${API_BASE_URL}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': 'default-user'
        },
        body: JSON.stringify(actionData)
      });

      if (response.ok) {
        const newAction = await response.json();
        setActions(prev => [newAction.action, ...prev]);
        setShowCreateForm(false);
        resetForm();
        toast.success('Action created successfully!');
        onActionCreate?.(newAction.action);
      } else {
        throw new Error('Failed to create action');
      }
    } catch (error) {
      console.error('Error creating action:', error);
      toast.error('Failed to create action');
    }
  };

  const handleExecute = async (actionId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/actions/${actionId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': 'default-user'
        }
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Action executed successfully!');
        loadActions(); // Reload to get updated status
      } else {
        throw new Error('Failed to execute action');
      }
    } catch (error) {
      console.error('Error executing action:', error);
      toast.error('Failed to execute action');
    }
  };

  const handleDelete = async (actionId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/actions/${actionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'user-id': 'default-user'
        }
      });

      if (response.ok) {
        setActions(prev => prev.filter(action => action._id !== actionId));
        toast.success('Action deleted successfully!');
        onActionDelete?.(actionId);
      } else {
        throw new Error('Failed to delete action');
      }
    } catch (error) {
      console.error('Error deleting action:', error);
      toast.error('Failed to delete action');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'order',
      priority: 'medium',
      requiresConfirmation: false,
      order: {
        productName: '',
        quantity: 1,
        price: 0,
        vendor: '',
        deliveryAddress: '',
        paymentMethod: ''
      },
      payment: {
        amount: 0,
        currency: 'INR',
        method: '',
        recipient: '',
        description: ''
      },
      database: {
        operation: 'query',
        table: '',
        query: '',
        data: {}
      },
      api: {
        url: '',
        method: 'GET',
        headers: {},
        body: {},
        timeout: 5000
      },
      notification: {
        type: 'email',
        recipient: '',
        subject: '',
        message: '',
        template: 'default'
      }
    });
  };

  const getActionIcon = (type) => {
    switch (type) {
      case 'order': return <FiShoppingCart />;
      case 'payment': return <FiCreditCard />;
      case 'database': return <FiDatabase />;
      case 'api_call': return <FiGlobe />;
      case 'file_operation': return <FiFile />;
      case 'system_command': return <FiTerminal />;
      case 'notification': return <FiBell />;
      default: return <FiZap />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-500';
      case 'running': return 'text-blue-500';
      case 'completed': return 'text-green-500';
      case 'failed': return 'text-red-500';
      case 'cancelled': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="action-manager">
      <div className="action-manager-header">
        <h2 className="text-2xl font-bold text-white mb-4">⚡ Action Engine</h2>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreateForm(true)}
          className="create-action-btn"
        >
          <FiZap className="mr-2" />
          Create Action
        </motion.button>
      </div>

      {/* Action Statistics */}
      <div className="action-stats">
        <div className="stat-card">
          <div className="stat-number">{actions.filter(a => a.status === 'pending').length}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{actions.filter(a => a.status === 'completed').length}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{actions.filter(a => a.status === 'failed').length}</div>
          <div className="stat-label">Failed</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{actions.filter(a => a.type === 'order').length}</div>
          <div className="stat-label">Orders</div>
        </div>
      </div>

      {/* Action List */}
      <div className="action-list">
        {loading ? (
          <div className="loading-spinner">Loading actions...</div>
        ) : actions.length === 0 ? (
          <div className="empty-state">
            <FiZap className="empty-icon" />
            <p>No actions created yet</p>
            <button onClick={() => setShowCreateForm(true)} className="create-first-action-btn">
              Create your first action
            </button>
          </div>
        ) : (
          <AnimatePresence>
            {actions.map((action) => (
              <motion.div
                key={action._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="action-card"
              >
                <div className="action-header">
                  <div className="action-title">
                    <div className="action-icon">
                      {getActionIcon(action.type)}
                    </div>
                    <h3>{action.name}</h3>
                    <span className={`priority-badge ${getPriorityColor(action.priority)}`}>
                      {action.priority}
                    </span>
                  </div>
                  <div className="action-actions">
                    {action.status === 'pending' && (
                      <button
                        onClick={() => handleExecute(action._id)}
                        className="action-btn execute-btn"
                        title="Execute now"
                      >
                        <FiPlay />
                      </button>
                    )}
                    <button
                      onClick={() => setEditingAction(action)}
                      className="action-btn edit-btn"
                      title="Edit action"
                    >
                      <FiEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(action._id)}
                      className="action-btn delete-btn"
                      title="Delete action"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>

                <div className="action-content">
                  <p className="action-description">{action.description}</p>

                  <div className="action-meta">
                    <div className="meta-item">
                      <span className={`status-badge ${getStatusColor(action.status)}`}>
                        {action.status}
                      </span>
                    </div>

                    <div className="meta-item">
                      <span className="action-type-badge">
                        {action.type}
                      </span>
                    </div>

                    {action.executedAt && (
                      <div className="meta-item">
                        <span>Executed: {formatDate(action.executedAt)}</span>
                      </div>
                    )}
                  </div>

                  {/* Action-specific details */}
                  {action.order && (
                    <div className="action-details">
                      <h4>Order Details:</h4>
                      <p>Product: {action.order.productName}</p>
                      <p>Quantity: {action.order.quantity}</p>
                      <p>Price: ₹{action.order.price}</p>
                    </div>
                  )}

                  {action.payment && (
                    <div className="action-details">
                      <h4>Payment Details:</h4>
                      <p>Amount: ₹{action.payment.amount}</p>
                      <p>Recipient: {action.payment.recipient}</p>
                      <p>Method: {action.payment.method}</p>
                    </div>
                  )}

                  {action.executionHistory && action.executionHistory.length > 0 && (
                    <div className="execution-history">
                      <h4>Execution History:</h4>
                      {action.executionHistory.slice(-3).map((execution, index) => (
                        <div key={index} className="execution-item">
                          <span className={`execution-status ${getStatusColor(execution.status)}`}>
                            {execution.status}
                          </span>
                          <span className="execution-time">
                            {formatDate(execution.timestamp)}
                          </span>
                          {execution.duration && (
                            <span className="execution-duration">
                              {execution.duration}ms
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Create/Edit Action Modal */}
      <AnimatePresence>
        {(showCreateForm || editingAction) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="action-modal"
            >
              <div className="modal-header">
                <h3>{editingAction ? 'Edit Action' : 'Create New Action'}</h3>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingAction(null);
                    resetForm();
                  }}
                  className="close-btn"
                >
                  <FiX />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="action-form">
                <div className="form-group">
                  <label>Action Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="form-textarea"
                    rows="3"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Action Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="form-select"
                    >
                      <option value="order">Product Order</option>
                      <option value="payment">Payment</option>
                      <option value="database">Database Operation</option>
                      <option value="api_call">API Call</option>
                      <option value="file_operation">File Operation</option>
                      <option value="system_command">System Command</option>
                      <option value="notification">Notification</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="form-select"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                {/* Order-specific fields */}
                {formData.type === 'order' && (
                  <div className="action-type-fields">
                    <h4>Order Details</h4>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Product Name</label>
                        <input
                          type="text"
                          value={formData.order.productName}
                          onChange={(e) => setFormData({
                            ...formData,
                            order: { ...formData.order, productName: e.target.value }
                          })}
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <label>Quantity</label>
                        <input
                          type="number"
                          value={formData.order.quantity}
                          onChange={(e) => setFormData({
                            ...formData,
                            order: { ...formData.order, quantity: parseInt(e.target.value) }
                          })}
                          className="form-input"
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Price</label>
                        <input
                          type="number"
                          value={formData.order.price}
                          onChange={(e) => setFormData({
                            ...formData,
                            order: { ...formData.order, price: parseFloat(e.target.value) }
                          })}
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <label>Vendor</label>
                        <input
                          type="text"
                          value={formData.order.vendor}
                          onChange={(e) => setFormData({
                            ...formData,
                            order: { ...formData.order, vendor: e.target.value }
                          })}
                          className="form-input"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment-specific fields */}
                {formData.type === 'payment' && (
                  <div className="action-type-fields">
                    <h4>Payment Details</h4>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Amount</label>
                        <input
                          type="number"
                          value={formData.payment.amount}
                          onChange={(e) => setFormData({
                            ...formData,
                            payment: { ...formData.payment, amount: parseFloat(e.target.value) }
                          })}
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <label>Currency</label>
                        <select
                          value={formData.payment.currency}
                          onChange={(e) => setFormData({
                            ...formData,
                            payment: { ...formData.payment, currency: e.target.value }
                          })}
                          className="form-select"
                        >
                          <option value="INR">INR</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Recipient</label>
                        <input
                          type="text"
                          value={formData.payment.recipient}
                          onChange={(e) => setFormData({
                            ...formData,
                            payment: { ...formData.payment, recipient: e.target.value }
                          })}
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <label>Payment Method</label>
                        <input
                          type="text"
                          value={formData.payment.method}
                          onChange={(e) => setFormData({
                            ...formData,
                            payment: { ...formData.payment, method: e.target.value }
                          })}
                          className="form-input"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.requiresConfirmation}
                      onChange={(e) => setFormData({ ...formData, requiresConfirmation: e.target.checked })}
                      className="form-checkbox"
                    />
                    Requires Confirmation
                  </label>
                </div>

                <div className="form-actions">
                  <button type="button" onClick={() => {
                    setShowCreateForm(false);
                    setEditingAction(null);
                    resetForm();
                  }} className="cancel-btn">
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn">
                    {editingAction ? 'Update Action' : 'Create Action'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ActionManager;
