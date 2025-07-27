#!/usr/bin/env python3
"""
EHB AI Agent Manager - Manage multiple AI agents
"""

import asyncio
import json
from datetime import datetime
from typing import Any, Dict, List

from .agent_base import AIAgentBase


class AIAgentManager:
    def __init__(self):
        self.agents: Dict[str, AIAgentBase] = {}
        self.agent_configs = {}
        self.communication_channels = {}
    
    async def register_agent(self, agent: AIAgentBase) -> bool:
        """Register a new agent"""
        try:
            self.agents[agent.agent_id] = agent
            print(f"Registered agent: {agent.name}")
            return True
        except Exception as e:
            print(f"Failed to register agent: {e}")
            return False
    
    async def get_agent(self, agent_id: str) -> AIAgentBase:
        """Get agent by ID"""
        return self.agents.get(agent_id)
    
    async def get_all_agents(self) -> List[AIAgentBase]:
        """Get all registered agents"""
        return list(self.agents.values())
    
    async def communicate(self, from_agent_id: str, to_agent_id: str, message: Dict[str, Any]) -> bool:
        """Enable communication between agents"""
        try:
            from_agent = self.agents.get(from_agent_id)
            to_agent = self.agents.get(to_agent_id)
            
            if from_agent and to_agent:
                # Process communication
                response = await to_agent.process_input(message)
                return True
            return False
        except Exception as e:
            print(f"Communication failed: {e}")
            return False
    
    def get_manager_status(self) -> Dict[str, Any]:
        """Get manager status"""
        return {
            "total_agents": len(self.agents),
            "active_agents": len([a for a in self.agents.values() if a.is_active]),
            "agent_ids": list(self.agents.keys()),
            "communication_channels": len(self.communication_channels)
        }
