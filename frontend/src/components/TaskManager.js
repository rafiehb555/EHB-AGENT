import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiClock, FiCalendar, FiPlus, FiEdit, FiTrash2, FiPlay, FiPause, FiCheck, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

const TaskManager = ({ onTaskCreate, onTaskUpdate, onTaskDelete }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'reminder',
    scheduledFor: '',
    priority: 'medium',
    recurring: {
      enabled: false,
      pattern: 'daily',
      interval: 1
    },
    tags: [],
    category: ''
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Load tasks on component mount
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        headers: {
          'Content-Type': 'application/json',
          'user-id': 'default-user'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      } else {
        throw new Error('Failed to load tasks');
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const taskData = {
        ...formData,
        scheduledFor: new Date(formData.scheduledFor).toISOString()
      };

      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': 'default-user'
        },
        body: JSON.stringify(taskData)
      });

      if (response.ok) {
        const newTask = await response.json();
        setTasks(prev => [newTask.task, ...prev]);
        setShowCreateForm(false);
        resetForm();
        toast.success('Task created successfully!');
        onTaskCreate?.(newTask.task);
      } else {
        throw new Error('Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    }
  };

  const handleUpdate = async (taskId, updates) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'user-id': 'default-user'
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setTasks(prev => prev.map(task =>
          task._id === taskId ? updatedTask.task : task
        ));
        setEditingTask(null);
        toast.success('Task updated successfully!');
        onTaskUpdate?.(updatedTask.task);
      } else {
        throw new Error('Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const handleDelete = async (taskId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'user-id': 'default-user'
        }
      });

      if (response.ok) {
        setTasks(prev => prev.filter(task => task._id !== taskId));
        toast.success('Task deleted successfully!');
        onTaskDelete?.(taskId);
      } else {
        throw new Error('Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const handleExecute = async (taskId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': 'default-user'
        }
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Task executed successfully!');
        loadTasks(); // Reload to get updated status
      } else {
        throw new Error('Failed to execute task');
      }
    } catch (error) {
      console.error('Error executing task:', error);
      toast.error('Failed to execute task');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'reminder',
      scheduledFor: '',
      priority: 'medium',
      recurring: {
        enabled: false,
        pattern: 'daily',
        interval: 1
      },
      tags: [],
      category: ''
    });
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
    <div className="task-manager">
      <div className="task-manager-header">
        <h2 className="text-2xl font-bold text-white mb-4">📅 Task Manager</h2>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreateForm(true)}
          className="create-task-btn"
        >
          <FiPlus className="mr-2" />
          Create Task
        </motion.button>
      </div>

      {/* Task Statistics */}
      <div className="task-stats">
        <div className="stat-card">
          <div className="stat-number">{tasks.filter(t => t.status === 'pending').length}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{tasks.filter(t => t.status === 'completed').length}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{tasks.filter(t => t.status === 'failed').length}</div>
          <div className="stat-label">Failed</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{tasks.filter(t => t.recurring?.enabled).length}</div>
          <div className="stat-label">Recurring</div>
        </div>
      </div>

      {/* Task List */}
      <div className="task-list">
        {loading ? (
          <div className="loading-spinner">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <FiCalendar className="empty-icon" />
            <p>No tasks scheduled yet</p>
            <button onClick={() => setShowCreateForm(true)} className="create-first-task-btn">
              Create your first task
            </button>
          </div>
        ) : (
          <AnimatePresence>
            {tasks.map((task) => (
              <motion.div
                key={task._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="task-card"
              >
                <div className="task-header">
                  <div className="task-title">
                    <h3>{task.title}</h3>
                    <span className={`priority-badge ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  <div className="task-actions">
                    {task.status === 'pending' && (
                      <button
                        onClick={() => handleExecute(task._id)}
                        className="action-btn execute-btn"
                        title="Execute now"
                      >
                        <FiPlay />
                      </button>
                    )}
                    <button
                      onClick={() => setEditingTask(task)}
                      className="action-btn edit-btn"
                      title="Edit task"
                    >
                      <FiEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(task._id)}
                      className="action-btn delete-btn"
                      title="Delete task"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>

                <div className="task-content">
                  <p className="task-description">{task.description}</p>

                  <div className="task-meta">
                    <div className="meta-item">
                      <FiClock className="meta-icon" />
                      <span>{formatDate(task.scheduledFor)}</span>
                    </div>

                    <div className="meta-item">
                      <span className={`status-badge ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </div>

                    {task.recurring?.enabled && (
                      <div className="meta-item">
                        <span className="recurring-badge">
                          🔄 {task.recurring.pattern}
                        </span>
                      </div>
                    )}
                  </div>

                  {task.tags?.length > 0 && (
                    <div className="task-tags">
                      {task.tags.map((tag, index) => (
                        <span key={index} className="tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Create/Edit Task Modal */}
      <AnimatePresence>
        {(showCreateForm || editingTask) && (
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
              className="task-modal"
            >
              <div className="modal-header">
                <h3>{editingTask ? 'Edit Task' : 'Create New Task'}</h3>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingTask(null);
                    resetForm();
                  }}
                  className="close-btn"
                >
                  <FiX />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="task-form">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                    <label>Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="form-select"
                    >
                      <option value="reminder">Reminder</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="voice_command">Voice Command</option>
                      <option value="ai_task">AI Task</option>
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

                <div className="form-group">
                  <label>Scheduled For *</label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledFor}
                    onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.recurring.enabled}
                      onChange={(e) => setFormData({
                        ...formData,
                        recurring: { ...formData.recurring, enabled: e.target.checked }
                      })}
                      className="form-checkbox"
                    />
                    Enable Recurring
                  </label>
                </div>

                {formData.recurring.enabled && (
                  <div className="form-row">
                    <div className="form-group">
                      <label>Pattern</label>
                      <select
                        value={formData.recurring.pattern}
                        onChange={(e) => setFormData({
                          ...formData,
                          recurring: { ...formData.recurring, pattern: e.target.value }
                        })}
                        className="form-select"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Interval</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.recurring.interval}
                        onChange={(e) => setFormData({
                          ...formData,
                          recurring: { ...formData.recurring, interval: parseInt(e.target.value) }
                        })}
                        className="form-input"
                      />
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="form-input"
                    placeholder="e.g., Work, Personal, Health"
                  />
                </div>

                <div className="form-actions">
                  <button type="button" onClick={() => {
                    setShowCreateForm(false);
                    setEditingTask(null);
                    resetForm();
                  }} className="cancel-btn">
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn">
                    {editingTask ? 'Update Task' : 'Create Task'}
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

export default TaskManager;
