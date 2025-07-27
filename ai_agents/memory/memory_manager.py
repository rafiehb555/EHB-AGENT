#!/usr/bin/env python3
"""
EHB AI Memory Manager - Manage agent memory and learning
"""

import json
import pickle
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List


class AIMemoryManager:
    def __init__(self, agent_id: str):
        self.agent_id = agent_id
        self.short_term_memory = []
        self.long_term_memory = {}
        self.learning_patterns = []
        self.memory_file = Path(f"ai_data/memory_{agent_id}.json")
        self.memory_file.parent.mkdir(parents=True, exist_ok=True)
    
    def store_memory(self, memory_type: str, data: Any) -> bool:
        """Store memory"""
        try:
            memory_entry = {
                "type": memory_type,
                "data": data,
                "timestamp": datetime.now().isoformat(),
                "agent_id": self.agent_id
            }
            
            if memory_type == "short_term":
                self.short_term_memory.append(memory_entry)
                if len(self.short_term_memory) > 100:  # Keep last 100
                    self.short_term_memory = self.short_term_memory[-100:]
            else:
                self.long_term_memory[memory_type] = memory_entry
            
            return True
        except Exception as e:
            print(f"Memory storage failed: {e}")
            return False
    
    def retrieve_memory(self, memory_type: str, query: str = None) -> List[Dict]:
        """Retrieve memory"""
        try:
            if memory_type == "short_term":
                return self.short_term_memory
            else:
                return [self.long_term_memory.get(memory_type, {})]
        except Exception as e:
            print(f"Memory retrieval failed: {e}")
            return []
    
    def learn_pattern(self, pattern: Dict[str, Any]) -> bool:
        """Learn new pattern"""
        try:
            self.learning_patterns.append({
                "pattern": pattern,
                "timestamp": datetime.now().isoformat()
            })
            return True
        except Exception as e:
            print(f"Pattern learning failed: {e}")
            return False
    
    def save_memory(self) -> bool:
        """Save memory to file"""
        try:
            memory_data = {
                "short_term_memory": self.short_term_memory,
                "long_term_memory": self.long_term_memory,
                "learning_patterns": self.learning_patterns
            }
            
            with open(self.memory_file, "w") as f:
                json.dump(memory_data, f, indent=2)
            
            return True
        except Exception as e:
            print(f"Memory save failed: {e}")
            return False
    
    def load_memory(self) -> bool:
        """Load memory from file"""
        try:
            if self.memory_file.exists():
                with open(self.memory_file, "r") as f:
                    memory_data = json.load(f)
                
                self.short_term_memory = memory_data.get("short_term_memory", [])
                self.long_term_memory = memory_data.get("long_term_memory", {})
                self.learning_patterns = memory_data.get("learning_patterns", [])
                
                return True
            return False
        except Exception as e:
            print(f"Memory load failed: {e}")
            return False
