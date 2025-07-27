#!/usr/bin/env python3
"""
EHB AI Agent Development Checker - High-level AI agent development setup
"""

import importlib
import json
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path


class EHBAIAgentDevelopmentChecker:
    def __init__(self):
        self.project_root = Path.cwd()
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "ai_tools_installed": [],
            "ai_tools_missing": [],
            "sdk_installed": [],
            "sdk_missing": [],
            "data_created": [],
            "agents_configured": [],
            "ai_models_ready": [],
            "development_tools": [],
            "errors_fixed": [],
            "summary": {}
        }
    
    def check_ai_development_tools(self):
        """Check and install AI development tools"""
        print("🤖 Checking AI Development Tools...")
        
        ai_tools = [
            "openai",
            "langchain",
            "transformers",
            "torch",
            "tensorflow",
            "scikit-learn",
            "numpy",
            "pandas",
            "matplotlib",
            "seaborn",
            "jupyter",
            "ipython",
            "streamlit",
            "gradio",
            "fastapi",
            "uvicorn",
            "sqlalchemy",
            "redis",
            "celery",
            "pydantic",
            "python-dotenv",
            "python-jose",
            "passlib",
            "bcrypt",
            "httpx",
            "aiofiles",
            "python-multipart"
        ]
        
        for tool in ai_tools:
            try:
                importlib.import_module(tool.replace("-", "_"))
                print(f"✅ {tool}: Installed")
                self.results["ai_tools_installed"].append(tool)
            except ImportError:
                print(f"❌ {tool}: Missing - Installing...")
                try:
                    subprocess.run([sys.executable, "-m", "pip", "install", tool], 
                                 check=True, capture_output=True)
                    print(f"✅ {tool}: Installed successfully")
                    self.results["ai_tools_installed"].append(tool)
                    self.results["errors_fixed"].append(f"Installed AI tool: {tool}")
                except subprocess.CalledProcessError:
                    print(f"❌ {tool}: Failed to install")
                    self.results["ai_tools_missing"].append(tool)
    
    def check_ai_sdks(self):
        """Check and install AI SDKs"""
        print("🔧 Checking AI SDKs...")
        
        ai_sdks = [
            "openai",
            "anthropic",
            "cohere",
            "huggingface_hub",
            "sentence_transformers",
            "chromadb",
            "pinecone-client",
            "weaviate-client",
            "qdrant-client",
            "milvus",
            "faiss-cpu",
            "sentencepiece",
            "protobuf",
            "grpcio",
            "grpcio-tools"
        ]
        
        for sdk in ai_sdks:
            try:
                importlib.import_module(sdk.replace("-", "_"))
                print(f"✅ {sdk}: Installed")
                self.results["sdk_installed"].append(sdk)
            except ImportError:
                print(f"❌ {sdk}: Missing - Installing...")
                try:
                    subprocess.run([sys.executable, "-m", "pip", "install", sdk], 
                                 check=True, capture_output=True)
                    print(f"✅ {sdk}: Installed successfully")
                    self.results["sdk_installed"].append(sdk)
                    self.results["errors_fixed"].append(f"Installed AI SDK: {sdk}")
                except subprocess.CalledProcessError:
                    print(f"❌ {sdk}: Failed to install")
                    self.results["sdk_missing"].append(sdk)
    
    def create_ai_agent_structure(self):
        """Create AI agent development structure"""
        print("🏗️ Creating AI Agent Structure...")
        
        # Create AI agent directories
        ai_directories = [
            "ai_agents",
            "ai_agents/core",
            "ai_agents/models",
            "ai_agents/tools",
            "ai_agents/memory",
            "ai_agents/learning",
            "ai_agents/communication",
            "ai_agents/decision_making",
            "ai_agents/planning",
            "ai_agents/execution",
            "ai_agents/monitoring",
            "ai_agents/optimization",
            "ai_models",
            "ai_models/llm",
            "ai_models/embedding",
            "ai_models/vector",
            "ai_models/training",
            "ai_data",
            "ai_data/datasets",
            "ai_data/knowledge_base",
            "ai_data/conversations",
            "ai_data/experiences",
            "ai_configs",
            "ai_configs/agents",
            "ai_configs/models",
            "ai_configs/environments",
            "ai_tests",
            "ai_tests/unit",
            "ai_tests/integration",
            "ai_tests/performance",
            "ai_docs",
            "ai_docs/api",
            "ai_docs/guides",
            "ai_docs/examples"
        ]
        
        for directory in ai_directories:
            Path(directory).mkdir(parents=True, exist_ok=True)
            print(f"✅ Created directory: {directory}")
            self.results["data_created"].append(f"Directory: {directory}")
    
    def create_ai_agent_files(self):
        """Create essential AI agent files"""
        print("📝 Creating AI Agent Files...")
        
        # Core AI agent files
        ai_files = {
            "ai_agents/core/agent_base.py": '''#!/usr/bin/env python3
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
        }''',
            
            "ai_agents/core/agent_manager.py": '''#!/usr/bin/env python3
"""
EHB AI Agent Manager - Manage multiple AI agents
"""

from typing import Dict, List, Any
import asyncio
import json
from datetime import datetime
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
            print(f"✅ Registered agent: {agent.name}")
            return True
        except Exception as e:
            print(f"❌ Failed to register agent: {e}")
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
            print(f"❌ Communication failed: {e}")
            return False
    
    def get_manager_status(self) -> Dict[str, Any]:
        """Get manager status"""
        return {
            "total_agents": len(self.agents),
            "active_agents": len([a for a in self.agents.values() if a.is_active]),
            "agent_ids": list(self.agents.keys()),
            "communication_channels": len(self.communication_channels)
        }''',
            
            "ai_agents/memory/memory_manager.py": '''#!/usr/bin/env python3
"""
EHB AI Memory Manager - Manage agent memory and learning
"""

from typing import Dict, Any, List
import json
import pickle
from datetime import datetime
from pathlib import Path

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
            print(f"❌ Memory storage failed: {e}")
            return False
    
    def retrieve_memory(self, memory_type: str, query: str = None) -> List[Dict]:
        """Retrieve memory"""
        try:
            if memory_type == "short_term":
                return self.short_term_memory
            else:
                return [self.long_term_memory.get(memory_type, {})]
        except Exception as e:
            print(f"❌ Memory retrieval failed: {e}")
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
            print(f"❌ Pattern learning failed: {e}")
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
            print(f"❌ Memory save failed: {e}")
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
            print(f"❌ Memory load failed: {e}")
            return False''',
            
            "ai_configs/agents/agent_config.json": '''{
  "agents": {
    "healthcare_agent": {
      "id": "healthcare_agent",
      "name": "EHB Healthcare Agent",
      "type": "specialized",
      "capabilities": [
        "patient_management",
        "medical_records",
        "appointment_scheduling",
        "health_analytics",
        "medical_advice"
      ],
      "model": "gpt-4",
      "memory_enabled": true,
      "learning_enabled": true,
      "communication_enabled": true
    },
    "data_agent": {
      "id": "data_agent",
      "name": "EHB Data Agent",
      "type": "data_processing",
      "capabilities": [
        "data_analysis",
        "data_cleaning",
        "data_visualization",
        "report_generation",
        "predictive_analytics"
      ],
      "model": "gpt-4",
      "memory_enabled": true,
      "learning_enabled": true,
      "communication_enabled": true
    },
    "development_agent": {
      "id": "development_agent",
      "name": "EHB Development Agent",
      "type": "development",
      "capabilities": [
        "code_generation",
        "bug_fixing",
        "testing",
        "deployment",
        "documentation"
      ],
      "model": "gpt-4",
      "memory_enabled": true,
      "learning_enabled": true,
      "communication_enabled": true
    }
  },
  "communication": {
    "protocol": "async",
    "timeout": 30,
    "retry_attempts": 3
  },
  "memory": {
    "short_term_limit": 100,
    "long_term_persistence": true,
    "learning_patterns": true
  }
}''',
            
            "ai_configs/models/model_config.json": '''{
  "models": {
    "llm": {
      "openai": {
        "api_key_env": "OPENAI_API_KEY",
        "models": ["gpt-4", "gpt-3.5-turbo"],
        "default_model": "gpt-4",
        "max_tokens": 4096,
        "temperature": 0.7
      },
      "anthropic": {
        "api_key_env": "ANTHROPIC_API_KEY",
        "models": ["claude-3-opus", "claude-3-sonnet"],
        "default_model": "claude-3-sonnet",
        "max_tokens": 4096,
        "temperature": 0.7
      }
    },
    "embedding": {
      "openai": {
        "model": "text-embedding-ada-002",
        "dimensions": 1536
      },
      "sentence_transformers": {
        "model": "all-MiniLM-L6-v2",
        "dimensions": 384
      }
    },
    "vector_store": {
      "chromadb": {
        "persist_directory": "./ai_data/vector_store",
        "collection_name": "ehb_knowledge"
      },
      "pinecone": {
        "api_key_env": "PINECONE_API_KEY",
        "environment": "us-west1-gcp"
      }
    }
  },
  "training": {
    "batch_size": 32,
    "learning_rate": 0.001,
    "epochs": 10,
    "validation_split": 0.2
  }
}''',
            
            "ai_data/datasets/healthcare_data.json": '''{
  "patients": [
    {
      "id": "P001",
      "name": "Ahmed Khan",
      "age": 45,
      "gender": "male",
      "medical_history": ["diabetes", "hypertension"],
      "current_medications": ["metformin", "lisinopril"],
      "last_visit": "2025-07-15",
      "next_appointment": "2025-07-25"
    },
    {
      "id": "P002", 
      "name": "Fatima Ali",
      "age": 32,
      "gender": "female",
      "medical_history": ["asthma"],
      "current_medications": ["albuterol"],
      "last_visit": "2025-07-10",
      "next_appointment": "2025-07-20"
    }
  ],
  "doctors": [
    {
      "id": "D001",
      "name": "Dr. Sarah Ahmed",
      "specialization": "Cardiology",
      "experience_years": 15,
      "patients_count": 150,
      "rating": 4.8
    },
    {
      "id": "D002",
      "name": "Dr. Ali Hassan", 
      "specialization": "Endocrinology",
      "experience_years": 12,
      "patients_count": 120,
      "rating": 4.6
    }
  ],
  "appointments": [
    {
      "id": "A001",
      "patient_id": "P001",
      "doctor_id": "D001",
      "date": "2025-07-25T10:00:00",
      "type": "consultation",
      "status": "scheduled"
    },
    {
      "id": "A002",
      "patient_id": "P002", 
      "doctor_id": "D002",
      "date": "2025-07-20T14:00:00",
      "type": "follow_up",
      "status": "scheduled"
    }
  ]
}''',
            
            "ai_tests/unit/test_agent_base.py": '''#!/usr/bin/env python3
"""
EHB AI Agent Base Tests
"""

import pytest
import asyncio
from ai_agents.core.agent_base import AIAgentBase

class TestAgent(AIAgentBase):
    async def process_input(self, input_data):
        return {"response": "test response"}
    
    async def learn(self, experience):
        return True
    
    async def plan(self, goal):
        return ["step1", "step2"]
    
    async def execute(self, action):
        return {"result": "executed"}

@pytest.mark.asyncio
async def test_agent_creation():
    """Test agent creation"""
    agent = TestAgent("test_agent", "Test Agent", ["test_capability"])
    assert agent.agent_id == "test_agent"
    assert agent.name == "Test Agent"
    assert agent.is_active == True

@pytest.mark.asyncio
async def test_agent_status():
    """Test agent status"""
    agent = TestAgent("test_agent", "Test Agent", ["test_capability"])
    status = agent.get_status()
    assert "agent_id" in status
    assert "name" in status
    assert "capabilities" in status

@pytest.mark.asyncio
async def test_agent_processing():
    """Test agent input processing"""
    agent = TestAgent("test_agent", "Test Agent", ["test_capability"])
    response = await agent.process_input({"test": "data"})
    assert "response" in response

@pytest.mark.asyncio
async def test_agent_learning():
    """Test agent learning"""
    agent = TestAgent("test_agent", "Test Agent", ["test_capability"])
    result = await agent.learn({"experience": "test"})
    assert result == True

@pytest.mark.asyncio
async def test_agent_planning():
    """Test agent planning"""
    agent = TestAgent("test_agent", "Test Agent", ["test_capability"])
    plan = await agent.plan("test goal")
    assert isinstance(plan, list)
    assert len(plan) > 0

@pytest.mark.asyncio
async def test_agent_execution():
    """Test agent execution"""
    agent = TestAgent("test_agent", "Test Agent", ["test_capability"])
    result = await agent.execute("test action")
    assert "result" in result''',
            
            "ai_docs/api/agent_api.md": '''# EHB AI Agent API Documentation

## Overview
EHB AI Agent system provides intelligent agents for healthcare management.

## Agent Types

### Healthcare Agent
- **Purpose**: Patient management and medical records
- **Capabilities**: 
  - Patient data processing
  - Medical record management
  - Appointment scheduling
  - Health analytics
  - Medical advice generation

### Data Agent
- **Purpose**: Data processing and analytics
- **Capabilities**:
  - Data analysis
  - Data cleaning
  - Data visualization
  - Report generation
  - Predictive analytics

### Development Agent
- **Purpose**: Code development and maintenance
- **Capabilities**:
  - Code generation
  - Bug fixing
  - Testing
  - Deployment
  - Documentation

## API Endpoints

### Agent Management
- `POST /api/agents` - Create new agent
- `GET /api/agents` - List all agents
- `GET /api/agents/{agent_id}` - Get agent details
- `PUT /api/agents/{agent_id}` - Update agent
- `DELETE /api/agents/{agent_id}` - Delete agent

### Agent Communication
- `POST /api/agents/{agent_id}/process` - Process input
- `POST /api/agents/{agent_id}/learn` - Learn from experience
- `POST /api/agents/{agent_id}/plan` - Create plan
- `POST /api/agents/{agent_id}/execute` - Execute action

### Agent Memory
- `GET /api/agents/{agent_id}/memory` - Get agent memory
- `POST /api/agents/{agent_id}/memory` - Store memory
- `DELETE /api/agents/{agent_id}/memory` - Clear memory

## Configuration
All agent configurations are stored in `ai_configs/agents/agent_config.json`

## Testing
Run tests with: `pytest ai_tests/`
'''
        }
        
        for file_path, content in ai_files.items():
            try:
                file_path_obj = Path(file_path)
                file_path_obj.parent.mkdir(parents=True, exist_ok=True)
                
                with open(file_path_obj, "w") as f:
                    f.write(content)
                
                print(f"✅ Created: {file_path}")
                self.results["data_created"].append(f"File: {file_path}")
                
            except Exception as e:
                print(f"❌ Failed to create {file_path}: {e}")
    
    def install_development_tools(self):
        """Install development tools for AI agent development"""
        print("🛠️ Installing Development Tools...")
        
        dev_tools = [
            "jupyter",
            "ipython",
            "streamlit",
            "gradio",
            "dash",
            "plotly",
            "bokeh",
            "altair",
            "seaborn",
            "wordcloud",
            "nltk",
            "spacy",
            "textblob",
            "gensim",
            "word2vec",
            "fastapi",
            "uvicorn",
            "sqlalchemy",
            "alembic",
            "redis",
            "celery",
            "flower",
            "prometheus_client",
            "grafana_api",
            "elasticsearch",
            "kibana",
            "loguru",
            "rich",
            "tqdm",
            "click",
            "typer",
            "pydantic",
            "marshmallow",
            "cerberus",
            "jsonschema",
            "pyyaml",
            "toml",
            "configparser",
            "python-dotenv",
            "python-decouple",
            "dynaconf",
            "hydra-core",
            "omegaconf",
            "pytest",
            "pytest-asyncio",
            "pytest-cov",
            "pytest-mock",
            "pytest-xdist",
            "pytest-benchmark",
            "pytest-html",
            "pytest-json-report",
            "black",
            "isort",
            "flake8",
            "mypy",
            "bandit",
            "safety",
            "pre-commit",
            "tox",
            "coverage",
            "codecov",
            "sphinx",
            "mkdocs",
            "mkdocs-material",
            "pdoc3",
            "sphinx-rtd-theme",
            "sphinx-autodoc-typehints",
            "sphinx-paramlinks",
            "sphinx-panels",
            "sphinx-tabs",
            "sphinx-copybutton",
            "sphinx-autobuild",
            "sphinx-autodoc",
            "sphinx-autosummary",
            "sphinx-gallery",
            "sphinx-issues",
            "sphinx-removed-in",
            "sphinx-tabs",
            "sphinx-thebe",
            "sphinx-book-theme",
            "sphinx-press-theme",
            "sphinx-rtd-theme",
            "sphinx-material",
            "sphinx-bootstrap-theme",
            "sphinx-better-theme",
            "sphinx-typo3-theme",
            "sphinx-rtd-theme",
            "sphinx-bootstrap-theme",
            "sphinx-better-theme",
            "sphinx-typo3-theme"
        ]
        
        for tool in dev_tools:
            try:
                subprocess.run([sys.executable, "-m", "pip", "install", tool], 
                             check=True, capture_output=True)
                print(f"✅ {tool}: Installed")
                self.results["development_tools"].append(tool)
            except subprocess.CalledProcessError:
                print(f"❌ {tool}: Failed to install")
    
    def run_comprehensive_check(self):
        """Run comprehensive AI agent development check"""
        print("🤖 EHB AI Agent Development Checker")
        print("=" * 60)
        print("Checking AI agent development environment...")
        print("=" * 60)
        
        try:
            # Step 1: Check AI development tools
            self.check_ai_development_tools()
            
            # Step 2: Check AI SDKs
            self.check_ai_sdks()
            
            # Step 3: Create AI agent structure
            self.create_ai_agent_structure()
            
            # Step 4: Create AI agent files
            self.create_ai_agent_files()
            
            # Step 5: Install development tools
            self.install_development_tools()
            
            # Step 6: Generate summary
            self.generate_summary()
            
            print("✅ AI agent development check completed")
            
        except Exception as e:
            print(f"❌ AI agent development check failed: {e}")
            self.results["summary"]["status"] = "failed"
            self.results["summary"]["error"] = str(e)
        
        return self.results
    
    def generate_summary(self):
        """Generate comprehensive summary"""
        print("\n" + "=" * 60)
        print("📊 AI AGENT DEVELOPMENT CHECK SUMMARY")
        print("=" * 60)
        
        # AI tools installed
        if self.results["ai_tools_installed"]:
            print(f"🤖 AI Tools Installed: {len(self.results['ai_tools_installed'])}")
            for tool in self.results["ai_tools_installed"][:10]:  # Show first 10
                print(f"  ✅ {tool}")
        
        # AI SDKs installed
        if self.results["sdk_installed"]:
            print(f"\n🔧 AI SDKs Installed: {len(self.results['sdk_installed'])}")
            for sdk in self.results["sdk_installed"][:10]:  # Show first 10
                print(f"  ✅ {sdk}")
        
        # Development tools
        if self.results["development_tools"]:
            print(f"\n🛠️ Development Tools: {len(self.results['development_tools'])}")
            for tool in self.results["development_tools"][:10]:  # Show first 10
                print(f"  ✅ {tool}")
        
        # Data created
        if self.results["data_created"]:
            print(f"\n📁 Data Created: {len(self.results['data_created'])}")
            for item in self.results["data_created"][:10]:  # Show first 10
                print(f"  📄 {item}")
        
        # Errors fixed
        if self.results["errors_fixed"]:
            print(f"\n🔧 Errors Fixed: {len(self.results['errors_fixed'])}")
            for error in self.results["errors_fixed"][:10]:  # Show first 10
                print(f"  ✅ {error}")
        
        # Missing tools
        if self.results["ai_tools_missing"]:
            print(f"\n❌ Missing AI Tools: {len(self.results['ai_tools_missing'])}")
            for tool in self.results["ai_tools_missing"]:
                print(f"  ❌ {tool}")
        
        if self.results["sdk_missing"]:
            print(f"\n❌ Missing SDKs: {len(self.results['sdk_missing'])}")
            for sdk in self.results["sdk_missing"]:
                print(f"  ❌ {sdk}")
        
        # Calculate success rate
        total_tools = len(self.results["ai_tools_installed"]) + len(self.results["ai_tools_missing"])
        if total_tools > 0:
            success_rate = (len(self.results["ai_tools_installed"]) / total_tools) * 100
            print(f"\n📈 Success Rate: {success_rate:.1f}%")
        
        # Save results
        report_file = f"reports/ai_agent_development_check_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        Path("reports").mkdir(exist_ok=True)
        
        with open(report_file, "w") as f:
            json.dump(self.results, f, indent=2)
        
        print(f"\n📄 Detailed report saved: {report_file}")
        print("=" * 60)
        
        self.results["summary"] = {
            "ai_tools_installed": len(self.results["ai_tools_installed"]),
            "ai_tools_missing": len(self.results["ai_tools_missing"]),
            "sdk_installed": len(self.results["sdk_installed"]),
            "sdk_missing": len(self.results["sdk_missing"]),
            "development_tools": len(self.results["development_tools"]),
            "data_created": len(self.results["data_created"]),
            "errors_fixed": len(self.results["errors_fixed"]),
            "success_rate": success_rate if total_tools > 0 else 100,
            "report_file": report_file
        }

def main():
    """Main function"""
    try:
        checker = EHBAIAgentDevelopmentChecker()
        results = checker.run_comprehensive_check()
        
        if results["summary"]["success_rate"] >= 80:
            print("\n🎉 AI agent development check completed successfully!")
            return 0
        else:
            print(f"\n⚠️ Some tools missing. Success rate: {results['summary']['success_rate']:.1f}%")
            return 1
            
    except Exception as e:
        print(f"❌ AI agent development check failed: {e}")
        return 1

if __name__ == "__main__":
    exit(main()) 