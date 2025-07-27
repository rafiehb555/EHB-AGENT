interface OfflineTask {
    id: string;
    type: string;
    command: string;
    data: any;
    timestamp: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'pending' | 'syncing' | 'completed' | 'failed';
    retryCount: number;
    maxRetries: number;
}

interface SyncResult {
    success: boolean;
    syncedTasks: number;
    failedTasks: number;
    message: string;
}

class OfflineQueue {
    private dbName = 'EHB_Robot_Offline_Queue';
    private dbVersion = 1;
    private db: IDBDatabase | null = null;
    private isOnline = navigator.onLine;
    private syncInterval: NodeJS.Timeout | null = null;

    constructor() {
        this.initializeDatabase();
        this.setupOnlineOfflineListeners();
        this.startSyncInterval();
        console.log('✅ Offline Queue initialized');
    }

    private async initializeDatabase() {
        return new Promise<void>((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('Failed to open IndexedDB');
                reject(new Error('Failed to open IndexedDB'));
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ IndexedDB initialized');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Create tasks store
                if (!db.objectStoreNames.contains('tasks')) {
                    const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
                    taskStore.createIndex('status', 'status', { unique: false });
                    taskStore.createIndex('timestamp', 'timestamp', { unique: false });
                    taskStore.createIndex('priority', 'priority', { unique: false });
                }

                // Create settings store
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
            };
        });
    }

    private setupOnlineOfflineListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('🌐 Internet connection restored');
            this.syncPendingTasks();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('📡 Internet connection lost - switching to offline mode');
        });
    }

    private startSyncInterval() {
        // Sync every 30 seconds when online
        this.syncInterval = setInterval(() => {
            if (this.isOnline) {
                this.syncPendingTasks();
            }
        }, 30000);
    }

    // Add task to offline queue
    async addTask(type: string, command: string, data: any, priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'): Promise<{
        success: boolean;
        taskId: string;
        message: string;
    }> {
        try {
            if (!this.db) {
                throw new Error('Database not initialized');
            }

            const task: OfflineTask = {
                id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type,
                command,
                data,
                timestamp: new Date().toISOString(),
                priority,
                status: 'pending',
                retryCount: 0,
                maxRetries: 3
            };

            const transaction = this.db.transaction(['tasks'], 'readwrite');
            const store = transaction.objectStore('tasks');
            await this.promisifyRequest(store.add(task));

            // If online, try to sync immediately
            if (this.isOnline) {
                this.syncTask(task);
            }

            return {
                success: true,
                taskId: task.id,
                message: this.isOnline ?
                    '✅ Task added and synced immediately' :
                    '📱 Task stored offline - will sync when online'
            };
        } catch (error) {
            console.error('Add task error:', error);
            return {
                success: false,
                taskId: '',
                message: '❌ Failed to add task to offline queue'
            };
        }
    }

    // Get all pending tasks
    async getPendingTasks(): Promise<OfflineTask[]> {
        try {
            if (!this.db) {
                throw new Error('Database not initialized');
            }

            const transaction = this.db.transaction(['tasks'], 'readonly');
            const store = transaction.objectStore('tasks');
            const index = store.index('status');
            const request = index.getAll('pending');

            return await this.promisifyRequest(request);
        } catch (error) {
            console.error('Get pending tasks error:', error);
            return [];
        }
    }

    // Get task by ID
    async getTask(taskId: string): Promise<OfflineTask | null> {
        try {
            if (!this.db) {
                throw new Error('Database not initialized');
            }

            const transaction = this.db.transaction(['tasks'], 'readonly');
            const store = transaction.objectStore('tasks');
            const request = store.get(taskId);

            return await this.promisifyRequest(request);
        } catch (error) {
            console.error('Get task error:', error);
            return null;
        }
    }

    // Update task status
    async updateTaskStatus(taskId: string, status: OfflineTask['status']): Promise<boolean> {
        try {
            if (!this.db) {
                throw new Error('Database not initialized');
            }

            const task = await this.getTask(taskId);
            if (!task) {
                return false;
            }

            task.status = status;
            if (status === 'syncing') {
                task.retryCount++;
            }

            const transaction = this.db.transaction(['tasks'], 'readwrite');
            const store = transaction.objectStore('tasks');
            await this.promisifyRequest(store.put(task));

            return true;
        } catch (error) {
            console.error('Update task status error:', error);
            return false;
        }
    }

    // Sync all pending tasks
    async syncPendingTasks(): Promise<SyncResult> {
        try {
            const pendingTasks = await this.getPendingTasks();
            let syncedCount = 0;
            let failedCount = 0;

            for (const task of pendingTasks) {
                if (task.retryCount >= task.maxRetries) {
                    await this.updateTaskStatus(task.id, 'failed');
                    failedCount++;
                    continue;
                }

                const success = await this.syncTask(task);
                if (success) {
                    syncedCount++;
                } else {
                    failedCount++;
                }
            }

            return {
                success: failedCount === 0,
                syncedTasks: syncedCount,
                failedTasks: failedCount,
                message: `Synced ${syncedCount} tasks, ${failedCount} failed`
            };
        } catch (error) {
            console.error('Sync pending tasks error:', error);
            return {
                success: false,
                syncedTasks: 0,
                failedTasks: 0,
                message: 'Failed to sync tasks'
            };
        }
    }

    // Sync individual task
    private async syncTask(task: OfflineTask): Promise<boolean> {
        try {
            await this.updateTaskStatus(task.id, 'syncing');

            // Simulate API call
            const response = await this.sendTaskToServer(task);

            if (response.success) {
                await this.updateTaskStatus(task.id, 'completed');
                return true;
            } else {
                await this.updateTaskStatus(task.id, 'pending');
                return false;
            }
        } catch (error) {
            console.error('Sync task error:', error);
            await this.updateTaskStatus(task.id, 'pending');
            return false;
        }
    }

    // Send task to server
    private async sendTaskToServer(task: OfflineTask): Promise<{ success: boolean; message: string }> {
        try {
            // Simulate network request
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Simulate 90% success rate
            const success = Math.random() > 0.1;

            return {
                success,
                message: success ?
                    `✅ Task "${task.command}" synced successfully` :
                    `❌ Failed to sync task "${task.command}"`
            };
        } catch (error) {
            console.error('Send task to server error:', error);
            return {
                success: false,
                message: 'Network error'
            };
        }
    }

    // Get offline queue statistics
    async getStatistics(): Promise<{
        totalTasks: number;
        pendingTasks: number;
        completedTasks: number;
        failedTasks: number;
        syncingTasks: number;
        isOnline: boolean;
    }> {
        try {
            if (!this.db) {
                throw new Error('Database not initialized');
            }

            const transaction = this.db.transaction(['tasks'], 'readonly');
            const store = transaction.objectStore('tasks');
            const request = store.getAll();

            const tasks: OfflineTask[] = await this.promisifyRequest(request);

            return {
                totalTasks: tasks.length,
                pendingTasks: tasks.filter(t => t.status === 'pending').length,
                completedTasks: tasks.filter(t => t.status === 'completed').length,
                failedTasks: tasks.filter(t => t.status === 'failed').length,
                syncingTasks: tasks.filter(t => t.status === 'syncing').length,
                isOnline: this.isOnline
            };
        } catch (error) {
            console.error('Get statistics error:', error);
            return {
                totalTasks: 0,
                pendingTasks: 0,
                completedTasks: 0,
                failedTasks: 0,
                syncingTasks: 0,
                isOnline: this.isOnline
            };
        }
    }

    // Clear completed tasks
    async clearCompletedTasks(): Promise<number> {
        try {
            if (!this.db) {
                throw new Error('Database not initialized');
            }

            const transaction = this.db.transaction(['tasks'], 'readwrite');
            const store = transaction.objectStore('tasks');
            const index = store.index('status');
            const request = index.getAllKeys('completed');

            const keys = await this.promisifyRequest(request);
            let deletedCount = 0;

            for (const key of keys) {
                await this.promisifyRequest(store.delete(key));
                deletedCount++;
            }

            return deletedCount;
        } catch (error) {
            console.error('Clear completed tasks error:', error);
            return 0;
        }
    }

    // Clear all tasks
    async clearAllTasks(): Promise<boolean> {
        try {
            if (!this.db) {
                throw new Error('Database not initialized');
            }

            const transaction = this.db.transaction(['tasks'], 'readwrite');
            const store = transaction.objectStore('tasks');
            await this.promisifyRequest(store.clear());

            return true;
        } catch (error) {
            console.error('Clear all tasks error:', error);
            return false;
        }
    }

    // Save setting
    async saveSetting(key: string, value: any): Promise<boolean> {
        try {
            if (!this.db) {
                throw new Error('Database not initialized');
            }

            const transaction = this.db.transaction(['settings'], 'readwrite');
            const store = transaction.objectStore('settings');
            await this.promisifyRequest(store.put({ key, value }));

            return true;
        } catch (error) {
            console.error('Save setting error:', error);
            return false;
        }
    }

    // Get setting
    async getSetting(key: string): Promise<any> {
        try {
            if (!this.db) {
                throw new Error('Database not initialized');
            }

            const transaction = this.db.transaction(['settings'], 'readonly');
            const store = transaction.objectStore('settings');
            const request = store.get(key);

            const result = await this.promisifyRequest(request);
            return result ? result.value : null;
        } catch (error) {
            console.error('Get setting error:', error);
            return null;
        }
    }

    // Helper method to promisify IndexedDB requests
    private promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Check if task is safe for offline storage
    isTaskSafeForOffline(type: string, data: any): boolean {
        // Don't store payment-related tasks offline
        const unsafeTypes = ['payment', 'financial', 'billing', 'purchase'];
        const unsafeKeywords = ['credit_card', 'bank_account', 'payment_info', 'billing_info'];

        if (unsafeTypes.includes(type.toLowerCase())) {
            return false;
        }

        const dataString = JSON.stringify(data).toLowerCase();
        if (unsafeKeywords.some(keyword => dataString.includes(keyword))) {
            return false;
        }

        return true;
    }

    // Get offline status
    getOfflineStatus(): { isOnline: boolean; pendingTasks: number; lastSync: string } {
        return {
            isOnline: this.isOnline,
            pendingTasks: 0, // This would be updated in real implementation
            lastSync: new Date().toISOString()
        };
    }

    // Cleanup
    destroy() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        if (this.db) {
            this.db.close();
        }
    }
}

export default OfflineQueue;
