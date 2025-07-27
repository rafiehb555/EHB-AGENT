
import os
import sys
import time
import signal
import psutil
import logging
from pathlib import Path
from typing import Dict, List, Optional

class RobustAgentManager:
    """Robust agent manager that prevents stopping issues"""
    
    def __init__(self):
        self.agents = {}
        self.running = True
        self.restart_count = {}
        self.max_restarts = 5
        
        # Setup signal handlers
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
        
        # Setup logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('agent_manager.log', encoding='utf-8'),
                logging.StreamHandler(sys.stdout)
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def signal_handler(self, signum, frame):
        """Handle shutdown signals gracefully"""
        self.logger.info("Received shutdown signal, stopping agents gracefully...")
        self.running = False
        self.stop_all_agents()
        sys.exit(0)
    
    def start_agent(self, agent_name: str, agent_script: str, restart_on_failure: bool = True):
        """Start an agent with monitoring"""
        try:
            if agent_name in self.agents:
                self.stop_agent(agent_name)
            
            self.logger.info(f"Starting agent: {agent_name}")
            
            # Start agent process
            process = subprocess.Popen(
                [sys.executable, agent_script],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                encoding='utf-8'
            )
            
            self.agents[agent_name] = {
                'process': process,
                'script': agent_script,
                'restart_on_failure': restart_on_failure,
                'start_time': time.time(),
                'restart_count': 0
            }
            
            self.logger.info(f"Agent {agent_name} started successfully")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to start agent {agent_name}: {e}")
            return False
    
    def stop_agent(self, agent_name: str):
        """Stop an agent gracefully"""
        if agent_name in self.agents:
            agent_info = self.agents[agent_name]
            process = agent_info['process']
            
            try:
                # Send SIGTERM first
                process.terminate()
                
                # Wait for graceful shutdown
                try:
                    process.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    # Force kill if needed
                    process.kill()
                    process.wait()
                
                self.logger.info(f"Agent {agent_name} stopped successfully")
                
            except Exception as e:
                self.logger.error(f"Error stopping agent {agent_name}: {e}")
            
            del self.agents[agent_name]
    
    def stop_all_agents(self):
        """Stop all agents"""
        for agent_name in list(self.agents.keys()):
            self.stop_agent(agent_name)
    
    def monitor_agents(self):
        """Monitor agents and restart if needed"""
        while self.running:
            try:
                for agent_name, agent_info in list(self.agents.items()):
                    process = agent_info['process']
                    
                    # Check if process is still running
                    if process.poll() is not None:
                        self.logger.warning(f"Agent {agent_name} has stopped")
                        
                        if agent_info['restart_on_failure'] and agent_info['restart_count'] < self.max_restarts:
                            self.logger.info(f"Restarting agent {agent_name}")
                            agent_info['restart_count'] += 1
                            self.start_agent(agent_name, agent_info['script'])
                        else:
                            self.logger.error(f"Agent {agent_name} exceeded max restarts")
                            del self.agents[agent_name]
                
                time.sleep(5)  # Check every 5 seconds
                
            except Exception as e:
                self.logger.error(f"Error in agent monitoring: {e}")
                time.sleep(5)
    
    def get_agent_status(self) -> Dict[str, Dict]:
        """Get status of all agents"""
        status = {}
        for agent_name, agent_info in self.agents.items():
            process = agent_info['process']
            status[agent_name] = {
                'running': process.poll() is None,
                'pid': process.pid,
                'restart_count': agent_info['restart_count'],
                'uptime': time.time() - agent_info['start_time']
            }
        return status

if __name__ == "__main__":
    manager = RobustAgentManager()
    
    # Start agents
    manager.start_agent("cursor_live", "cursor_live_system.py")
    manager.start_agent("auto_fix", "auto_cursor_script.py")
    
    # Start monitoring
    manager.monitor_agents()
