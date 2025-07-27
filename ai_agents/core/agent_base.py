#!/usr/bin/env python3
"""
EHB AI Agent Base - Core agent functionality
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List
import asyncio
import json
from datetime import datetime

class AIAgentBase(ABC):
    def __init__(self, agent_id: str, name: str, capabilities: List[str]):
        self.agent_id = agent_id
        self.name = name
        self.capabilities = capabilities
        self.memory = {}
        self.learning_data = []
        self.created_at = datetime.now()
        self.is_active = True
    
    @abstractmethod
    async def process_input(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process input and return response"""
        pass
    
    @abstractmethod
    async def learn(self, experience: Dict[str, Any]) -> bool:
        """Learn from experience"""
        pass
    
    @abstractmethod
    async def plan(self, goal: str) -> List[str]:
        """Create plan to achieve goal"""
        pass
    
    @abstractmethod
    async def execute(self, action: str) -> Dict[str, Any]:
        """Execute action"""
        pass
    
    def get_status(self) -> Dict[str, Any]:
        """Get agent status"""
        return {
            "agent_id": self.agent_id,
            "name": self.name,
            "capabilities": self.capabilities,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat(),
            "memory_size": len(self.memory),
            "learning_experiences": len(self.learning_data)
        }