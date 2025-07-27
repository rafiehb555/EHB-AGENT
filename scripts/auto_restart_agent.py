#!/usr/bin/env python3
"""
EHB Auto Restart Agent - Automatically restart agent when it stops
"""

import json
import os
import signal
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path


class EHBAutoRestartAgent:
    def __init__(self):
        self.processes = {}
        self.restart_count = {}
        self.max_restarts = 5
        self.restart_delay = 10  # seconds
        self.monitoring_interval = 30  # seconds
        
        # Load configuration
        self.load_config()
        
        # Setup signal handlers
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
    
    def load_config(self):
        """Load auto restart configuration"""
        self.config = {
            "services": [
                {
                    "name": "frontend",
                    "command": "npm run dev",
                    "cwd": ".",
                    "port": 3000,
                    "health_check": "http://localhost:3000"
                },
                {
                    "name": "backend",
                    "command": "python main.py",
                    "cwd": "backend",
                    "port": 8000,
                    "health_check": "http://localhost:8000/health"
                },
                {
                    "name": "agent_monitor",
                    "command": "node agents/watchdog/agentMonitor.js",
                    "cwd": ".",
                    "port": None,
                    "health_check": None
                }
            ],
            "auto_restart": True,
            "health_check_interval": 30,
            "max_restart_attempts": 5,
            "restart_delay": 10
        }
    
    def signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        print(f"\n🛑 Received signal {signum}, shutting down...")
        self.shutdown()
        sys.exit(0)
    
    def start_service(self, service_config):
        """Start a service"""
        service_name = service_config["name"]
        
        try:
            print(f"🚀 Starting {service_name}...")
            
            # Change to service directory if specified
            cwd = service_config.get("cwd", ".")
            
            # Start the process
            process = subprocess.Popen(
                service_config["command"],
                shell=True,
                cwd=cwd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            self.processes[service_name] = {
                "process": process,
                "config": service_config,
                "start_time": datetime.now(),
                "restart_count": 0
            }
            
            print(f"✅ {service_name} started with PID {process.pid}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to start {service_name}: {e}")
            return False
    
    def stop_service(self, service_name):
        """Stop a service"""
        if service_name in self.processes:
            process_info = self.processes[service_name]
            process = process_info["process"]
            
            try:
                print(f"🛑 Stopping {service_name}...")
                process.terminate()
                
                # Wait for graceful shutdown
                try:
                    process.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    print(f"⚠️ {service_name} didn't stop gracefully, forcing...")
                    process.kill()
                
                print(f"✅ {service_name} stopped")
                
            except Exception as e:
                print(f"❌ Error stopping {service_name}: {e}")
    
    def restart_service(self, service_name):
        """Restart a service"""
        service_config = None
        for service in self.config["services"]:
            if service["name"] == service_name:
                service_config = service
                break
        
        if not service_config:
            print(f"❌ Service {service_name} not found in configuration")
            return False
        
        # Stop the service
        self.stop_service(service_name)
        
        # Wait before restart
        print(f"⏳ Waiting {self.restart_delay} seconds before restart...")
        time.sleep(self.restart_delay)
        
        # Start the service
        return self.start_service(service_config)
    
    def check_service_health(self, service_name):
        """Check if a service is healthy"""
        if service_name not in self.processes:
            return False
        
        process_info = self.processes[service_name]
        process = process_info["process"]
        config = process_info["config"]
        
        # Check if process is still running
        if process.poll() is not None:
            print(f"⚠️ {service_name} process has stopped")
            return False
        
        # Check health endpoint if available
        health_check = config.get("health_check")
        if health_check:
            try:
                import requests
                response = requests.get(health_check, timeout=5)
                if response.status_code == 200:
                    return True
                else:
                    print(f"⚠️ {service_name} health check failed: {response.status_code}")
                    return False
            except Exception as e:
                print(f"⚠️ {service_name} health check error: {e}")
                return False
        
        # If no health check, just check if process is running
        return process.poll() is None
    
    def monitor_services(self):
        """Monitor all services and restart if needed"""
        print("🔍 Monitoring services...")
        
        for service_config in self.config["services"]:
            service_name = service_config["name"]
            
            if service_name not in self.processes:
                # Service not started, start it
                self.start_service(service_config)
                continue
            
            # Check service health
            if not self.check_service_health(service_name):
                process_info = self.processes[service_name]
                restart_count = process_info["restart_count"]
                
                if restart_count < self.max_restarts:
                    print(f"🔄 Restarting {service_name} (attempt {restart_count + 1}/{self.max_restarts})")
                    
                    if self.restart_service(service_name):
                        process_info["restart_count"] += 1
                        process_info["last_restart"] = datetime.now()
                        print(f"✅ {service_name} restarted successfully")
                    else:
                        print(f"❌ Failed to restart {service_name}")
                else:
                    print(f"🚨 {service_name} has exceeded maximum restart attempts")
                    self.log_service_failure(service_name)
            else:
                # Reset restart count if service is healthy
                if service_name in self.processes:
                    self.processes[service_name]["restart_count"] = 0
    
    def log_service_failure(self, service_name):
        """Log service failure"""
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "service": service_name,
            "event": "max_restarts_exceeded",
            "restart_count": self.processes[service_name]["restart_count"]
        }
        
        log_file = Path("logs/service_failures.log")
        log_file.parent.mkdir(exist_ok=True)
        
        with open(log_file, "a") as f:
            f.write(json.dumps(log_entry) + "\n")
    
    def start_all_services(self):
        """Start all configured services"""
        print("🚀 Starting all EHB services...")
        
        for service_config in self.config["services"]:
            self.start_service(service_config)
            time.sleep(2)  # Small delay between starts
        
        print("✅ All services started")
    
    def shutdown(self):
        """Shutdown all services gracefully"""
        print("🛑 Shutting down all services...")
        
        for service_name in list(self.processes.keys()):
            self.stop_service(service_name)
        
        print("✅ All services stopped")
    
    def run(self):
        """Main monitoring loop"""
        print("🤖 EHB Auto Restart Agent")
        print("=" * 40)
        print("Monitoring and auto-restarting services...")
        print("Press Ctrl+C to stop")
        print("=" * 40)
        
        try:
            # Start all services
            self.start_all_services()
            
            # Main monitoring loop
            while True:
                self.monitor_services()
                time.sleep(self.monitoring_interval)
                
        except KeyboardInterrupt:
            print("\n🛑 Received interrupt signal")
        except Exception as e:
            print(f"❌ Error in monitoring loop: {e}")
        finally:
            self.shutdown()

def main():
    """Main function"""
    try:
        agent = EHBAutoRestartAgent()
        agent.run()
        return 0
    except Exception as e:
        print(f"❌ Auto restart agent failed: {e}")
        return 1

if __name__ == "__main__":
    exit(main()) 