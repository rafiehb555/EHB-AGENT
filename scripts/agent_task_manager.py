#!/usr/bin/env python3
"""
EHB-5 Agent Task Manager
Manages agent tasks and automatically pushes to GitHub
"""

import json
import datetime
import os
from auto_git_push import agent_complete_task, AutoGitPusher

class AgentTaskManager:
    def __init__(self):
        self.tasks_file = 'agent_tasks.json'
        self.auto_push = True
        self.pusher = AutoGitPusher()
        self.load_tasks()

    def load_tasks(self):
        """Load existing tasks"""
        try:
            if os.path.exists(self.tasks_file):
                with open(self.tasks_file, 'r') as f:
                    self.tasks = json.load(f)
            else:
                self.tasks = {'tasks': [], 'last_push': None, 'auto_push_enabled': True}
        except Exception as e:
            print(f"❌ Error loading tasks: {e}")
            self.tasks = {'tasks': [], 'last_push': None, 'auto_push_enabled': True}

    def save_tasks(self):
        """Save tasks to file"""
        try:
            with open(self.tasks_file, 'w') as f:
                json.dump(self.tasks, f, indent=2)
        except Exception as e:
            print(f"❌ Error saving tasks: {e}")

    def log_task(self, task_name, task_type, description, data=None):
        """Log a completed task"""
        task = {
            'id': len(self.tasks['tasks']) + 1,
            'name': task_name,
            'type': task_type,
            'description': description,
            'timestamp': datetime.datetime.now().isoformat(),
            'data': data or {}
        }

        self.tasks['tasks'].append(task)
        self.save_tasks()

        print(f"📝 Task logged: {task_name}")

        # Auto-push if enabled
        if self.auto_push and self.tasks['auto_push_enabled']:
            self.pusher.auto_push(f"🤖 Agent task: {task_name} - {description}")

        return task

    def get_recent_tasks(self, limit=10):
        """Get recent tasks"""
        return self.tasks['tasks'][-limit:]

    def get_task_stats(self):
        """Get task statistics"""
        if not self.tasks['tasks']:
            return {'total': 0, 'types': {}, 'recent': 0}

        stats = {
            'total': len(self.tasks['tasks']),
            'types': {},
            'recent': 0
        }

        # Count by type
        for task in self.tasks['tasks']:
            task_type = task['type']
            stats['types'][task_type] = stats['types'].get(task_type, 0) + 1

        # Count recent tasks (last 24 hours)
        yesterday = datetime.datetime.now() - datetime.timedelta(days=1)
        for task in self.tasks['tasks']:
            task_time = datetime.datetime.fromisoformat(task['timestamp'])
            if task_time > yesterday:
                stats['recent'] += 1

        return stats

# Predefined agent tasks
class AgentTasks:
    @staticmethod
    def data_processing_complete(data_type, records_processed):
        """Log data processing completion"""
        return agent_complete_task(
            "Data Processing",
            "data_processing",
            f"Processed {records_processed} {data_type} records",
            {
                'data_type': data_type,
                'records_processed': records_processed,
                'processing_time': datetime.datetime.now().isoformat()
            }
        )

    @staticmethod
    def configuration_updated(config_type, changes):
        """Log configuration update"""
        return agent_complete_task(
            "Configuration Update",
            "configuration",
            f"Updated {config_type} configuration",
            {
                'config_type': config_type,
                'changes': changes,
                'update_time': datetime.datetime.now().isoformat()
            }
        )

    @staticmethod
    def security_scan_complete(scan_type, threats_found):
        """Log security scan completion"""
        return agent_complete_task(
            "Security Scan",
            "security",
            f"Completed {scan_type} scan - {threats_found} threats found",
            {
                'scan_type': scan_type,
                'threats_found': threats_found,
                'scan_time': datetime.datetime.now().isoformat()
            }
        )

    @staticmethod
    def backup_created(backup_type, size_mb):
        """Log backup creation"""
        return agent_complete_task(
            "Backup Created",
            "backup",
            f"Created {backup_type} backup ({size_mb}MB)",
            {
                'backup_type': backup_type,
                'size_mb': size_mb,
                'backup_time': datetime.datetime.now().isoformat()
            }
        )

    @staticmethod
    def performance_optimization(component, improvement_percent):
        """Log performance optimization"""
        return agent_complete_task(
            "Performance Optimization",
            "optimization",
            f"Optimized {component} - {improvement_percent}% improvement",
            {
                'component': component,
                'improvement_percent': improvement_percent,
                'optimization_time': datetime.datetime.now().isoformat()
            }
        )

    @staticmethod
    def api_endpoint_tested(endpoint, status):
        """Log API endpoint test"""
        return agent_complete_task(
            "API Test",
            "api_testing",
            f"Tested {endpoint} - Status: {status}",
            {
                'endpoint': endpoint,
                'status': status,
                'test_time': datetime.datetime.now().isoformat()
            }
        )

# Example usage functions
def example_agent_workflow():
    """Example of how agents would use the task manager"""
    print("🤖 Starting example agent workflow...")

    # Simulate various agent tasks
    AgentTasks.data_processing_complete("user_data", 1500)
    AgentTasks.configuration_updated("database", ["connection_timeout", "max_connections"])
    AgentTasks.security_scan_complete("vulnerability", 0)
    AgentTasks.backup_created("system", 245)
    AgentTasks.performance_optimization("database_queries", 15)
    AgentTasks.api_endpoint_tested("/api/status", "200 OK")

    print("✅ Example workflow completed!")

if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        command = sys.argv[1]

        if command == "example":
            example_agent_workflow()
        elif command == "stats":
            manager = AgentTaskManager()
            stats = manager.get_task_stats()
            print(f"📊 Task Statistics:")
            print(f"   Total tasks: {stats['total']}")
            print(f"   Recent tasks (24h): {stats['recent']}")
            print(f"   Task types: {stats['types']}")
        elif command == "recent":
            manager = AgentTaskManager()
            recent = manager.get_recent_tasks(5)
            print(f"📝 Recent Tasks:")
            for task in recent:
                print(f"   {task['timestamp']} - {task['name']}: {task['description']}")
        else:
            print("Usage: python agent_task_manager.py [example|stats|recent]")
    else:
        example_agent_workflow()
